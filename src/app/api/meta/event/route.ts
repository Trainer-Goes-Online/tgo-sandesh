import { NextResponse } from "next/server";

import { TRACKING_CONFIG, capiReady } from "@/lib/tracking-config";
import { sendCapiEvent, sha256Hex, type StandardEvent } from "@/lib/meta-capi";
import { readClientIp, readClientUserAgent, readRequestCookie } from "@/lib/request-signals";

/**
 * The browser's route into Meta CAPI, for the PRE-PAYMENT events and Schedule.
 *
 * The allow-list below is what keeps a single public endpoint from becoming a
 * hole: only reviewed names are accepted, and PURCHASE IS EXPLICITLY NOT AMONG
 * THEM. Purchase is only ever sent server-side where the payment is proven:
 * /api/razorpay/verify (signature checked) and /api/razorpay/webhook
 * (signature checked). Without that exclusion anyone who learns this URL can
 * post a fake sale and teach the ad account to buy the wrong people.
 *
 * The client IP and user agent are read from THIS request's headers, which is
 * the correct source: this is a fetch from the visitor's own browser.
 */
const ALLOWED: StandardEvent[] = ["ViewContent", "AddToCart", "InitiateCheckout", "Schedule"];

/** The events that carry the booking fee as `value`. Set here, never trusted
 *  from the body. */
const WITH_VALUE = new Set<StandardEvent>(["ViewContent", "AddToCart", "InitiateCheckout"]);

/** The browser's event id, shared with its pixel call for deduplication. */
const EVENT_ID = /^[A-Za-z0-9_.:-]{8,100}$/;

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (!capiReady()) {
    return NextResponse.json({ ok: false, reason: "capi-not-configured" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const eventName = String(body.eventName ?? "") as StandardEvent;
  if (!ALLOWED.includes(eventName)) {
    return NextResponse.json(
      { ok: false, reason: "event-not-allowed" },
      { status: 400 },
    );
  }

  const email = str(body.email, 200);
  /* Body first (it may hold an `_fbc` synthesised from an fbclid before
     Meta's own cookie existed), cookie second (it survives a blocked pixel). */
  const fbp = str(body.fbp) || readRequestCookie(req, "_fbp") || undefined;
  const fbc = str(body.fbc) || readRequestCookie(req, "_fbc") || undefined;

  /* The browser's id when it sent one, so this event and its pixel twin
     collapse into one. Otherwise a deterministic key, by email where there is
     one, otherwise by _fbp, so Meta's 48h window still collapses repeats. */
  const bodyId = str(body.eventId, 100);
  const seed = email || fbp || `${Date.now()}_${Math.random()}`;
  const eventId = EVENT_ID.test(bodyId) ? bodyId : sha256Hex(`${seed}|${eventName}`);

  const country = str(body.country, 2);

  const result = await sendCapiEvent({
    pixelId: TRACKING_CONFIG.meta.pixelId,
    accessToken: TRACKING_CONFIG.meta.accessToken,
    eventName,
    eventId,
    /* Reduced to its origin inside sendCapiEvent, server-side, rather than
       trusted from the caller: the caller is a browser posting
       window.location.href, which is the value carrying the path and the
       fbclid. */
    eventSourceUrl: str(body.eventSourceUrl, 1000) || TRACKING_CONFIG.fallbackEventSourceUrl,
    user: {
      email: email || undefined,
      phone: str(body.phone, 20) || undefined,
      firstName: str(body.firstName, 80) || undefined,
      lastName: str(body.lastName, 80) || undefined,
      /* The checkout asks, so an overseas buyer is not reported as Indian.
         Falls back to India for the landing-page events, which carry no form. */
      country: country.length === 2 ? country.toLowerCase() : "in",
      city: str(body.city, 80) || undefined,
      externalId: str(body.externalId, 100) || undefined,
      fbc,
      fbp,
      clientIp: readClientIp(req) || undefined,
      clientUserAgent: readClientUserAgent(req) || undefined,
    },
    ...(WITH_VALUE.has(eventName) && {
      valueRupees: TRACKING_CONFIG.amountRupees,
      currency: TRACKING_CONFIG.currency,
    }),
    testEventCode: TRACKING_CONFIG.meta.testEventCode || undefined,
  });

  return NextResponse.json({ ok: result.ok, eventName, eventId });
}
