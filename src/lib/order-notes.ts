/**
 * The order-notes carrier: everything the webhook needs, read back off the
 * Razorpay order.
 *
 * create-order writes ONE KEY PER FIELD. It used to serialise everything into
 * one JSON string sliced across `x0`..`x9`, which fails all-or-nothing: the
 * slice cuts mid-string, the parse throws, and every field comes back empty
 * together. `readOrderContext` reads BOTH shapes, because an order created
 * before the flat writer shipped can still be paid after it.
 */

export type OrderContext = {
  createdAt: string; // ISO 8601. Only the old chunked shape carries one.
  firstName: string;
  lastName: string;
  city: string;
  /* "+91". Carried apart from the number because `phone` reaches Pabbly as
     full E.164 and the code cannot be split back out of it: +1 and +91 both
     begin with a 1, so any leading-digit guess is wrong for the countries that
     share a prefix. */
  dialCode: string;
  country: string; // ISO 3166-1 alpha-2, lowercase
  externalId: string;
  fbc: string;
  fbp: string;
  gaCid: string;
  clientIp: string;
  clientUserAgent: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
};

export const EMPTY_CONTEXT: OrderContext = {
  createdAt: "",
  firstName: "",
  lastName: "",
  city: "",
  dialCode: "",
  country: "",
  externalId: "",
  fbc: "",
  fbp: "",
  gaCid: "",
  clientIp: "",
  clientUserAgent: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  fbclid: "",
  referrer: "",
  landingUrl: "",
};

const MAX_CHUNKS = 10; // the old x0..x9 layout

/** The OLD chunked notes. Kept because a UPI collect request can sit in a bank
 *  app for minutes, so an order written by the previous shape can still be
 *  paid. Deletable once no unpaid order predates that deploy. */
function unpackContext(notes: Record<string, unknown>): OrderContext {
  let raw = "";
  for (let i = 0; i < MAX_CHUNKS; i += 1) {
    const part = notes[`x${i}`];
    if (typeof part !== "string" || !part) break;
    raw += part;
  }
  if (!raw) return { ...EMPTY_CONTEXT };
  try {
    const parsed = JSON.parse(raw) as Partial<OrderContext>;
    return { ...EMPTY_CONTEXT, ...parsed };
  } catch {
    /* A truncated blob is unparseable. Better an empty context than a throw
       inside a webhook that must return 200 or be retried. */
    return { ...EMPTY_CONTEXT };
  }
}

const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

function readBundle(raw: unknown): Record<string, string> {
  const s = str(raw);
  if (!s) return {};
  try {
    const parsed = JSON.parse(s) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* packJsonNote guarantees valid JSON, so this only fires on a note written
       by something else. An empty bundle costs those fields, never the rest. */
  }
  return {};
}

/** Read an order back in either shape: flat keys if present, chunked if not. */
export function readOrderContext(notes: Record<string, unknown>): OrderContext {
  const isNew = notes.cust != null || notes.lp != null || notes.clid != null;
  if (!isNew) return unpackContext(notes);

  const cust = readBundle(notes.cust);
  const meta = readBundle(notes.meta);
  const utm = readBundle(notes.utm);

  return {
    /* Always "" on the flat shape: the webhook takes the date from Razorpay's
       own `payment.created_at` instead. */
    createdAt: "",
    firstName: str(cust.fn),
    lastName: str(cust.ln),
    city: str(cust.ct),
    dialCode: str(cust.dl),
    country: str(cust.co),
    externalId: str(meta.xid),
    gaCid: str(meta.ga),
    fbc: str(notes.fbc),
    fbp: str(notes.fbp),
    clientIp: str(notes.ip),
    clientUserAgent: str(notes.ua),
    utmSource: str(utm.s),
    utmMedium: str(utm.m),
    utmCampaign: str(utm.c),
    utmContent: str(utm.n),
    utmTerm: str(utm.t),
    fbclid: str(notes.clid),
    referrer: str(notes.ref),
    landingUrl: str(notes.lp),
  };
}
