/**
 * Pabbly Connect: the fulfilment hand-off.
 *
 * Analytics tells Meta and GA4 THAT a sale happened. This tells the automation
 * WHO bought, so the buyer actually receives what they paid for: on this funnel
 * that is the booking link for their 1:1 call, the reminders around it, and a
 * row somewhere Sandesh can see before he takes the call.
 *
 * It is fired from the Razorpay webhook and nowhere else, for the same reason
 * the Purchase event is: the webhook is the only place a payment is proven, and
 * UPI buyers routinely never return to the tab. A browser-side hand-off would
 * silently skip most Indian buyers.
 *
 * Failure here must never fail the webhook. Razorpay retries a non-200, and a
 * retry would re-fire Meta and GA4 and double-count the sale. So this reports
 * its own success and swallows its own errors: the caller logs the result and
 * still returns 200.
 *
 * That contract is exactly why this retries IN PROCESS. Every other integration
 * on this funnel has a platform retrying behind it; this one has nobody.
 * Razorpay is deliberately told the webhook succeeded, so a single dropped POST
 * is not retried by anything, ever, and a buyer who has been charged has no
 * record anywhere outside the Razorpay dashboard. Three attempts with a short
 * backoff, then give up loudly.
 *
 * ── Why this payload carries the Meta match keys too ──────────────────────
 * Pabbly is not only fulfilment; it is the ONLY place the full, unhashed record
 * of a sale exists. Meta receives SHA-256 hashes and nothing descriptive, GA4
 * receives no PII at all, and Razorpay holds only what it needs to charge a
 * card. So `fbc`, `fbp`, `client_ip_address`, `client_user_agent`,
 * `external_id` and `purchase_event_id` ride along here as well, alongside the
 * UTM set: they are what makes it possible to rebuild, replay or reconcile a
 * Meta conversion later from the sheet. Without them a mis-sent conversion is
 * simply unrecoverable.
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
  /* Always "" on this funnel: the checkout asks no qualifying question. It is
     emitted anyway so the column set matches tgo-sunaina and tgo-superme
     exactly, which is what lets one Pabbly workflow template map all three.
     A column that exists everywhere is cheaper than a template per project,
     and Pabbly cannot add a key later without re-running the trigger. */
  occupation: string;
  /* This funnel sells a booking fee, so the buyer's next step is a page, not a
     WhatsApp group. The absolute /book url for THIS payment travels with the
     record so an automation can re-send it to someone who paid and then closed
     the tab before the calendar loaded, which on a ten-second wait is a real
     population. Included now rather than added later: Pabbly maps its fields
     from the first payload it ever sees. */
  bookingUrl: string;
};

/* Every key is emitted on every call, empty string where unknown. Pabbly builds
   its field mapper from the FIRST payload it sees, so a key that is merely
   absent on the first test call cannot be mapped afterwards without re-running
   the trigger: an omitted key is far more expensive here than an empty one. */
const s = (v: unknown) => (v == null ? "" : String(v));

export async function sendPabblyPurchase(
  p: PabblyPurchase,
): Promise<{ ok: boolean; status: number }> {
  const url = process.env.PABBLY_WEBHOOK_URL ?? "";
  if (!url) return { ok: false, status: 0 };

  /* Built ONCE, outside the retry loop: the body must be byte-identical across
     attempts so a workflow that dedupes on payment_id sees one sale, not three
     near-misses.

     Flat keys, snake_case, one level deep. Pabbly's step mapper cannot read a
     nested object: it arrives as an unusable blob. */
  const body = JSON.stringify({
    lead_id: s(p.leadId),
    created_at: s(p.createdAt),
    first_name: s(p.firstName),
    last_name: s(p.lastName),
    email: s(p.email),
    phone: s(p.phone),
    city: s(p.city),
    country_code: s(p.countryCode),
    fbc: s(p.fbc),
    fbp: s(p.fbp),
    client_ip_address: s(p.clientIp),
    client_user_agent: s(p.clientUserAgent),
    external_id: s(p.externalId),
    event_source_url: s(p.eventSourceUrl),
    amount: p.amountRupees,
    /* Boolean, not the string "false": a Pabbly router condition on a
       non-empty string treats "false" as true, and would route live sales
       down the test branch. */
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

    event: "purchase",
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
        /* A hanging Pabbly must not hold the Razorpay webhook open until the
           platform kills the handler. A killed handler never returns 200, so
           Razorpay retries the whole webhook and Meta and GA4 fire twice: the
           exact double-count this route is built to avoid. */
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

  /* Loud, because nothing downstream will catch this: the sale is charged, the
     buyer is waiting, and no record of them reached the sheet. */
  console.error(
    `[pabbly] purchase ${p.paymentId} FAILED after ${ATTEMPTS} attempts (last status ${status})`,
  );
  return { ok: false, status };
}
