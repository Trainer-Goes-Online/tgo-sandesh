/**
 * Pabbly Connect: the hand-off that tells the automation WHO is buying, with
 * their contact details, their campaign and their Meta ad ids. Same workflow
 * URL as before (PABBLY_WEBHOOK_URL), fired ONCE per buyer, only when the
 * payment is captured: type/event = "purchase", from /api/razorpay/webhook.
 *
 * Failure here must never fail the request, so it swallows its errors, reports
 * a status, and retries IN PROCESS, because nothing else ever will.
 *
 * NEVER REMOVE A KEY once Pabbly's steps map it. Removing one does not error,
 * it silently blanks a column downstream. The qualifying-form keys (physique,
 * seriousness, investment, decision, qualified, lead_event_id) are still
 * emitted, empty, for exactly that reason: the same workflow URL mapped them.
 */
export const pabblyReady = () => Boolean(process.env.PABBLY_WEBHOOK_URL);

export type PabblyEvent = "purchase";

export type PabblyRecord = {
  event: PabblyEvent;
  leadId: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164, no spaces: "+919075453949". */
  phone: string;
  /** ISO 3166-1 alpha-2, "IN". */
  countryCode: string;
  /** "+91". */
  dialCode: string;
  city: string;
  fbc: string;
  fbp: string;
  clientIp: string;
  clientUserAgent: string;
  externalId: string;
  gaClientId: string;
  eventSourceUrl: string;
  isTest: boolean;
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
  product: string;
  amountRupees: number;
  currency: string;
  orderId: string;
  paymentId: string;
  /** The Meta InitiateCheckout event id. */
  initiateCheckoutEventId: string;
  /** The Meta Purchase event id (the payment id). */
  purchaseEventId: string;
  /** Absolute /book url for this order, so an automation can re-send it to a
   *  buyer who closed the tab before booking. */
  bookingUrl: string;
};

/* Every key is emitted on every call, empty string where unknown: Pabbly builds
   its field mapper from the FIRST payload it sees, so a key that is merely
   absent cannot be mapped later without re-running the trigger. */
const s = (v: unknown) => (v == null ? "" : String(v));

export async function sendPabbly(p: PabblyRecord): Promise<{ ok: boolean; status: number }> {
  const url = process.env.PABBLY_WEBHOOK_URL ?? "";
  if (!url) return { ok: false, status: 0 };

  /* Built ONCE, outside the retry loop. Flat keys, one level deep: a nested
     object arrives in Pabbly's step mapper as an unusable blob. */
  const body = JSON.stringify({
    lead_id: s(p.leadId),
    created_at: s(p.createdAt),
    first_name: s(p.firstName),
    last_name: s(p.lastName),
    name: `${s(p.firstName)} ${s(p.lastName)}`.trim(),
    email: s(p.email),
    phone: s(p.phone),
    city: s(p.city),
    dial_code: s(p.dialCode),
    country_code: s(p.countryCode),

    /* One value behind both `type` and `event`, so a workflow branching on
       either takes the same path. */
    type: p.event,
    event: p.event,

    product: s(p.product),
    amount: Number(p.amountRupees) || 0,
    currency: s(p.currency),
    order_id: s(p.orderId),
    payment_id: s(p.paymentId),
    booking_url: s(p.bookingUrl),
    /* Boolean, not the string "false": a Pabbly router condition on a
       non-empty string treats "false" as true. */
    is_test: Boolean(p.isTest),

    utm_source: s(p.utmSource),
    utm_medium: s(p.utmMedium),
    utm_campaign: s(p.utmCampaign),
    utm_content: s(p.utmContent),
    utm_term: s(p.utmTerm),
    campaign_id: s(p.campaignId),
    adset_id: s(p.adsetId),
    ad_id: s(p.adId),
    campaign_name: s(p.campaignName),
    adset_name: s(p.adsetName),
    ad_name: s(p.adName),
    placement: s(p.placement),
    site_source_name: s(p.siteSourceName),
    fbclid: s(p.fbclid),
    fbc: s(p.fbc),
    fbp: s(p.fbp),
    referrer: s(p.referrer),
    landing_url: s(p.landingUrl),
    event_source_url: s(p.eventSourceUrl),

    client_ip_address: s(p.clientIp),
    client_user_agent: s(p.clientUserAgent),
    external_id: s(p.externalId),
    ga_client_id: s(p.gaClientId),
    initiate_checkout_event_id: s(p.initiateCheckoutEventId),
    purchase_event_id: s(p.purchaseEventId),

    /* Qualifying-form era keys. Empty, never removed: see the note above. */
    occupation: "",
    lead_event_id: "",
    physique: "",
    seriousness: "",
    investment: "",
    decision: "",
    qualified: false,
  });

  const ATTEMPTS = 3;
  let status = 0;
  const tag = `${p.event} ${p.orderId || p.leadId}`;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });

      if (res.ok) {
        if (attempt > 1) console.info(`[pabbly] ${tag} sent on attempt ${attempt}`);
        return { ok: true, status: res.status };
      }

      status = res.status;

      /* A 4xx is a deleted or re-generated workflow URL. No number of retries
         fixes that. */
      if (res.status >= 400 && res.status < 500) {
        console.error(`[pabbly] workflow rejected ${tag}: ${res.status}`);
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

  console.error(`[pabbly] ${tag} FAILED after ${ATTEMPTS} attempts (last status ${status})`);
  return { ok: false, status };
}
