/**
 * Pabbly Connect: the fulfilment hand-off.
 *
 * Analytics tells Meta and GA4 THAT a sale happened. This tells the automation
 * WHO bought, so the buyer receives the booking link for their 1:1 call, the
 * reminders, and a row Sandesh can see before he takes it. Fired from the
 * Razorpay webhook only, the one place a payment is proven.
 *
 * Failure here must never fail the webhook, because Razorpay retries a non-200
 * and that re-fires Meta and GA4. So it swallows its errors and reports a
 * status, and retries IN PROCESS, because nothing else ever will.
 *
 * The Meta match keys ride along because this is the only place a full,
 * unhashed record of a sale exists, and they make a mis-sent conversion
 * recoverable.
 *
 * NEVER REMOVE A KEY once Pabbly's steps map it. Removing one does not error,
 * it silently blanks a column downstream.
 */
export const pabblyReady = () => Boolean(process.env.PABBLY_WEBHOOK_URL);

export type PabblyPurchase = {
  leadId: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  /** "+91", kept apart from `phone`, which arrives as full E.164. */
  dialCode: string;
  countryCode: string;
  fbc: string;
  fbp: string;
  clientIp: string;
  clientUserAgent: string;
  externalId: string;
  eventSourceUrl: string;
  amountRupees: number;
  isTest: boolean;
  purchaseEventId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
  paymentId: string;
  orderId: string;
  currency: string;
  product: string;
  /** Always "" here: this checkout asks no qualifying question. Emitted so the
   *  column set matches the other TGO funnels. */
  occupation: string;
  /** The absolute /book url for THIS payment, so an automation can re-send it
   *  to someone who paid and closed the tab before the calendar loaded. */
  bookingUrl: string;
};

/* Every key is emitted on every call, empty string where unknown: Pabbly builds
   its field mapper from the FIRST payload it sees, so a key that is merely
   absent cannot be mapped later without re-running the trigger. */
const s = (v: unknown) => (v == null ? "" : String(v));

/* One constant behind both `type` and `event`, so a workflow branching on
   either takes the same path. */
const RECORD_TYPE = "purchase";

export async function sendPabblyPurchase(
  p: PabblyPurchase,
): Promise<{ ok: boolean; status: number }> {
  const url = process.env.PABBLY_WEBHOOK_URL ?? "";
  if (!url) return { ok: false, status: 0 };

  /* Built ONCE, outside the retry loop, so a workflow deduping on payment_id
     sees one sale rather than three near-misses. Flat keys, one level deep: a
     nested object arrives in Pabbly's step mapper as an unusable blob. */
  const body = JSON.stringify({
    lead_id: s(p.leadId),
    created_at: s(p.createdAt),
    first_name: s(p.firstName),
    last_name: s(p.lastName),
    email: s(p.email),
    phone: s(p.phone),
    city: s(p.city),
    /* Separate from `phone`, which arrives as full E.164: +1 and +91 both
       begin with a 1, so no leading-digit rule recovers a merged code. */
    dial_code: s(p.dialCode),
    country_code: s(p.countryCode),
    type: RECORD_TYPE,
    fbc: s(p.fbc),
    fbp: s(p.fbp),
    client_ip_address: s(p.clientIp),
    client_user_agent: s(p.clientUserAgent),
    external_id: s(p.externalId),
    event_source_url: s(p.eventSourceUrl),
    amount: p.amountRupees,
    /* Boolean, not the string "false": a Pabbly router condition on a
       non-empty string treats "false" as true. */
    is_test: Boolean(p.isTest),
    purchase_event_id: s(p.purchaseEventId),
    utm_source: s(p.utmSource),
    utm_medium: s(p.utmMedium),
    utm_campaign: s(p.utmCampaign),
    utm_content: s(p.utmContent),
    utm_term: s(p.utmTerm),
    fbclid: s(p.fbclid),
    referrer: s(p.referrer),
    landing_url: s(p.landingUrl),

    event: RECORD_TYPE,
    payment_id: s(p.paymentId),
    order_id: s(p.orderId),
    name: `${s(p.firstName)} ${s(p.lastName)}`.trim(),
    currency: s(p.currency),
    product: s(p.product),
    occupation: s(p.occupation),
    booking_url: s(p.bookingUrl),
  });

  const ATTEMPTS = 3;
  let status = 0;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        /* A hanging Pabbly must not hold the webhook open until the platform
           kills the handler: that never returns 200, so Razorpay retries and
           Meta and GA4 fire twice. */
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });

      if (res.ok) {
        if (attempt > 1) {
          console.info(
            `[pabbly] purchase ${p.paymentId} sent on attempt ${attempt}`,
          );
        }
        return { ok: true, status: res.status };
      }

      status = res.status;

      /* A 4xx is a deleted or re-generated workflow URL. No number of retries
         fixes that, and each one holds the webhook open for longer. */
      if (res.status >= 400 && res.status < 500) {
        console.error(
          `[pabbly] workflow rejected ${p.paymentId}: ${res.status}`,
        );
        return { ok: false, status: res.status };
      }
    } catch {
      status = 0;
    }

    if (attempt < ATTEMPTS) {
      await new Promise((resolve) => {
        setTimeout(resolve, attempt * 600);
      });
    }
  }

  /* Loud: the sale is charged, the buyer is waiting, and no record of them
     reached the sheet. Nothing downstream will catch this. */
  console.error(
    `[pabbly] purchase ${p.paymentId} FAILED after ${ATTEMPTS} attempts (last status ${status})`,
  );
  return { ok: false, status };
}
