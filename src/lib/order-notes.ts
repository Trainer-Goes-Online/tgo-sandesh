import { packJsonNote } from "@/lib/attribution-edge";

/**
 * The order-notes carrier: everything the webhook needs, written onto the
 * Razorpay order at create time and read back off the payment.
 *
 * WHY: the webhook that fires Purchase and the Pabbly purchase row is a
 * request from Razorpay, not from the buyer. It receives only what Razorpay
 * stored, so the buyer's IP, user agent, cookies, campaign and Meta ad ids have
 * to travel inside the notes or they are lost.
 *
 * Razorpay allows 15 note keys at 256 chars each and REJECTS the order if
 * either limit is passed. This layout uses FOURTEEN, one field per key where a
 * value can be long, and small packJsonNote bundles for the rest, so an
 * oversized value can only cost its own field.
 */

export type OrderContext = {
  firstName: string;
  lastName: string;
  city: string;
  /** E.164 as typed into the checkout. Razorpay's `payment.contact` wins where
   *  it exists: it is the number the buyer actually paid with. */
  phone: string;
  /* "+91". Carried apart from the number because +1 and +91 both begin with
     a 1, so the code cannot be split back out of the E.164 string. */
  dialCode: string;
  country: string; // ISO 3166-1 alpha-2, lowercase
  externalId: string;
  gaCid: string;
  /** The InitiateCheckout event id, so the sheet can join the two rows. */
  initiateCheckoutEventId: string;
  fbc: string;
  fbp: string;
  clientIp: string;
  clientUserAgent: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  campaignId: string;
  adsetId: string;
  adId: string;
  campaignName: string;
  adsetName: string;
  adName: string;
  placement: string;
  siteSourceName: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
};

const t = (v: unknown, max: number) => {
  const s = v == null ? "" : String(v);
  return s.length > max ? s.slice(0, max) : s;
};

/** Build the notes object for a new order. Every value is capped so the order
 *  is never rejected; a rejected order is an unpaid buyer. */
export function writeOrderNotes(kind: string, leadId: string, email: string, c: OrderContext) {
  const notes: Record<string, string> = {
    kind,
    lead_id: leadId,
    /* Readable in the Razorpay dashboard, for whoever opens a payment trying
       to work out whose it is. */
    email: t(email, 160),
    cust: packJsonNote({
      fn: t(c.firstName, 40),
      ln: t(c.lastName, 40),
      ct: t(c.city, 40),
      ph: t(c.phone, 16),
      co: t(c.country, 2),
      dl: t(c.dialCode, 6),
    }),
    meta: packJsonNote({
      xid: t(c.externalId, 40),
      ga: t(c.gaCid, 40),
      ic: t(c.initiateCheckoutEventId, 64),
    }),
    /* Ad URLs carry Meta NAMES in medium, campaign and content, which run to
       sixty characters in an agency account. */
    utm: packJsonNote({
      s: t(c.utmSource, 20),
      m: t(c.utmMedium, 55),
      c: t(c.utmCampaign, 55),
      n: t(c.utmContent, 55),
      t: t(c.utmTerm, 25),
    }),
    /* Ids get room first: a truncated id joins to nothing while still looking
       valid. */
    ads: packJsonNote({
      ci: t(c.campaignId, 24),
      si: t(c.adsetId, 24),
      ai: t(c.adId, 24),
      pl: t(c.placement, 40),
      ss: t(c.siteSourceName, 10),
    }),
    adn: packJsonNote({
      cn: t(c.campaignName, 70),
      sn: t(c.adsetName, 70),
      an: t(c.adName, 70),
    }),
    fbc: t(c.fbc, 256),
    fbp: t(c.fbp, 256),
    ip: t(c.clientIp, 64),
    ua: t(c.clientUserAgent, 256),
    clid: t(c.fbclid, 256),
    ctx: packJsonNote({
      lp: t(c.landingUrl, 180),
      ref: t(c.referrer, 60),
    }),
  };

  for (const [k, v] of Object.entries(notes)) {
    if (v.length > 256) notes[k] = v.slice(0, 256);
  }
  return notes;
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

/** Read an order (or payment) back. Missing keys come back as "". */
export function readOrderContext(notes: Record<string, unknown>): OrderContext {
  const cust = readBundle(notes.cust);
  const meta = readBundle(notes.meta);
  const utm = readBundle(notes.utm);
  const ads = readBundle(notes.ads);
  const adn = readBundle(notes.adn);
  const ctx = readBundle(notes.ctx);

  return {
    firstName: str(cust.fn),
    lastName: str(cust.ln),
    city: str(cust.ct),
    phone: str(cust.ph),
    dialCode: str(cust.dl),
    country: str(cust.co),
    externalId: str(meta.xid),
    gaCid: str(meta.ga),
    initiateCheckoutEventId: str(meta.ic),
    fbc: str(notes.fbc),
    fbp: str(notes.fbp),
    clientIp: str(notes.ip),
    clientUserAgent: str(notes.ua),
    utmSource: str(utm.s),
    utmMedium: str(utm.m),
    utmCampaign: str(utm.c),
    utmContent: str(utm.n),
    utmTerm: str(utm.t),
    campaignId: str(ads.ci),
    adsetId: str(ads.si),
    adId: str(ads.ai),
    placement: str(ads.pl),
    siteSourceName: str(ads.ss),
    campaignName: str(adn.cn),
    adsetName: str(adn.sn),
    adName: str(adn.an),
    fbclid: str(notes.clid),
    referrer: str(ctx.ref),
    landingUrl: str(ctx.lp),
  };
}
