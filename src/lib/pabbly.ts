/**
 * Pabbly Connect: the hand-off that tells the automation WHO filled the
 * qualifying form, with their answers, so they land in the sheet before the
 * call. Fired from /api/lead, once per completed form.
 *
 * Failure here must never fail the request, so it swallows its errors, reports
 * a status, and retries IN PROCESS, because nothing else ever will.
 *
 * NEVER REMOVE A KEY once Pabbly's steps map it. Removing one does not error,
 * it silently blanks a column downstream. The payment-era keys (payment_id,
 * order_id, purchase_event_id, amount...) are still emitted, empty or zero,
 * for exactly that reason: the same workflow URL mapped them.
 */
export const pabblyReady = () => Boolean(process.env.PABBLY_WEBHOOK_URL);

export type PabblyLead = {
  leadId: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  fbc: string;
  fbp: string;
  clientIp: string;
  clientUserAgent: string;
  externalId: string;
  eventSourceUrl: string;
  isTest: boolean;
  leadEventId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
  product: string;
  /** The absolute /book url with this person's prefill, so an automation can
   *  re-send it to someone who closed the tab before booking. */
  bookingUrl: string;
  physique: string;
  seriousness: string;
  investment: string;
  decision: string;
  qualified: boolean;
};

/* Every key is emitted on every call, empty string where unknown: Pabbly builds
   its field mapper from the FIRST payload it sees, so a key that is merely
   absent cannot be mapped later without re-running the trigger. */
const s = (v: unknown) => (v == null ? "" : String(v));

/* One constant behind both `type` and `event`, so a workflow branching on
   either takes the same path. */
const RECORD_TYPE = "lead";

export async function sendPabblyLead(p: PabblyLead): Promise<{ ok: boolean; status: number }> {
  const url = process.env.PABBLY_WEBHOOK_URL ?? "";
  if (!url) return { ok: false, status: 0 };

  /* Built ONCE, outside the retry loop. Flat keys, one level deep: a nested
     object arrives in Pabbly's step mapper as an unusable blob. */
  const body = JSON.stringify({
    lead_id: s(p.leadId),
    created_at: s(p.createdAt),
    first_name: s(p.firstName),
    last_name: s(p.lastName),
    email: s(p.email),
    phone: "",
    city: "",
    dial_code: "",
    country_code: "",
    type: RECORD_TYPE,
    fbc: s(p.fbc),
    fbp: s(p.fbp),
    client_ip_address: s(p.clientIp),
    client_user_agent: s(p.clientUserAgent),
    external_id: s(p.externalId),
    event_source_url: s(p.eventSourceUrl),
    amount: 0,
    /* Boolean, not the string "false": a Pabbly router condition on a
       non-empty string treats "false" as true. */
    is_test: Boolean(p.isTest),
    purchase_event_id: "",
    utm_source: s(p.utmSource),
    utm_medium: s(p.utmMedium),
    utm_campaign: s(p.utmCampaign),
    utm_content: s(p.utmContent),
    utm_term: s(p.utmTerm),
    fbclid: s(p.fbclid),
    referrer: s(p.referrer),
    landing_url: s(p.landingUrl),

    event: RECORD_TYPE,
    payment_id: "",
    order_id: "",
    name: `${s(p.firstName)} ${s(p.lastName)}`.trim(),
    currency: "",
    product: s(p.product),
    occupation: "",
    booking_url: s(p.bookingUrl),

    lead_event_id: s(p.leadEventId),
    physique: s(p.physique),
    seriousness: s(p.seriousness),
    investment: s(p.investment),
    decision: s(p.decision),
    qualified: Boolean(p.qualified),
  });

  const ATTEMPTS = 3;
  let status = 0;

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
        if (attempt > 1) console.info(`[pabbly] lead ${p.leadId} sent on attempt ${attempt}`);
        return { ok: true, status: res.status };
      }

      status = res.status;

      /* A 4xx is a deleted or re-generated workflow URL. No number of retries
         fixes that. */
      if (res.status >= 400 && res.status < 500) {
        console.error(`[pabbly] workflow rejected ${p.leadId}: ${res.status}`);
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

  console.error(
    `[pabbly] lead ${p.leadId} FAILED after ${ATTEMPTS} attempts (last status ${status})`,
  );
  return { ok: false, status };
}
