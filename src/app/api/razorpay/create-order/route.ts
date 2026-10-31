import crypto from "crypto";

import { NextResponse } from "next/server";

import { ATTR_COOKIE, readAttrCookie } from "@/lib/attribution-edge";
import { ORDER_KIND } from "@/lib/funnel";
import { writeOrderNotes, type OrderContext } from "@/lib/order-notes";
import { readClientIp, readClientUserAgent, readRequestCookie } from "@/lib/request-signals";
import {
  TRACKING_CONFIG,
  isTestMode,
  razorpayAuthHeader,
  razorpayReady,
} from "@/lib/tracking-config";

/**
 * Creates the Razorpay order the browser then pays. Sends nothing to Pabbly:
 * the only Pabbly row is the "purchase" one, from the webhook, once the
 * payment is captured.
 *
 * THE NOTES ARE THE POINT. The webhook that fires Purchase receives only what
 * Razorpay stored, and this is the last request the buyer's own browser makes
 * before paying, so it is the honest place to read their IP, user agent and
 * cookies. See lib/order-notes.ts for the layout.
 *
 * The amount is NEVER taken from the body: it is the server's
 * NEXT_PUBLIC_CHECKOUT_PRICE_INR, in paise.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** A plus, a non-zero first digit, at most 15 digits in all. */
const E164 = /^\+[1-9]\d{5,14}$/;

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (!razorpayReady()) {
    console.error("[create-order] Razorpay keys not configured");
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 503 });
  }
  const { keyId, keySecret } = TRACKING_CONFIG.razorpay;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const firstName = str(body.firstName, 80);
  const lastName = str(body.lastName, 80);
  const email = str(body.email, 160);
  const phone = str(body.phone, 20);
  const city = str(body.city, 80);
  const countryRaw = str(body.country, 2);
  const country = /^[A-Za-z]{2}$/.test(countryRaw) ? countryRaw.toLowerCase() : "in";
  const dialRaw = str(body.dialCode, 5);
  const dialCode = /^\+\d{1,4}$/.test(dialRaw) ? dialRaw : "";

  if (!firstName || !lastName || !EMAIL.test(email) || !E164.test(phone) || city.length < 2) {
    return NextResponse.json({ ok: false, reason: "missing-fields" }, { status: 400 });
  }

  /* The attribution the EDGE recorded, before any JavaScript ran. The body's
     copy comes from localStorage, which in-app browsers restrict, so each
     fills the other's gaps: body first, edge cookie second. */
  const edge = readAttrCookie(readRequestCookie(req, ATTR_COOKIE));
  const utm = (body.utm && typeof body.utm === "object" ? body.utm : {}) as Record<string, unknown>;
  const ads = (body.ads && typeof body.ads === "object" ? body.ads : {}) as Record<string, unknown>;
  const pick = (a: unknown, b: unknown, max = 100) => str(a, max) || str(b, max);

  const ctx: OrderContext = {
    firstName,
    lastName,
    city,
    phone,
    dialCode,
    country,
    externalId: str(body.externalId, 100),
    gaCid: str(body.gaClientId, 60),
    initiateCheckoutEventId: str(body.initiateCheckoutEventId, 100),
    /* Body first, because it may hold an `_fbc` synthesised from an fbclid
       before Meta's own cookie existed; cookie second, because it survives a
       blocked pixel. */
    fbc: str(body.fbc) || readRequestCookie(req, "_fbc"),
    fbp: str(body.fbp) || readRequestCookie(req, "_fbp"),
    /* Read from headers, never from the body: the browser cannot know its own
       IP, and a user agent sent up in JSON is trivially forged. */
    clientIp: readClientIp(req),
    clientUserAgent: readClientUserAgent(req),
    utmSource: pick(utm.source, edge.utmSource),
    utmMedium: pick(utm.medium, edge.utmMedium),
    utmCampaign: pick(utm.campaign, edge.utmCampaign),
    utmContent: pick(utm.content, edge.utmContent),
    utmTerm: pick(utm.term, edge.utmTerm),
    campaignId: pick(ads.campaignId, edge.campaignId, 32),
    adsetId: pick(ads.adsetId, edge.adsetId, 32),
    adId: pick(ads.adId, edge.adId, 32),
    campaignName: pick(ads.campaignName, edge.campaignName),
    adsetName: pick(ads.adsetName, edge.adsetName),
    adName: pick(ads.adName, edge.adName),
    placement: pick(ads.placement, edge.placement),
    siteSourceName: pick(ads.siteSourceName, edge.siteSourceName),
    fbclid: pick(body.fbclid, edge.fbclid, 256),
    referrer: pick(body.referrer, edge.referrer, 300),
    landingUrl: pick(body.landingUrl, edge.landingUrl, 1000),
  };

  /* Identity for the fulfilment record, minted before payment. */
  const leadId = crypto.randomUUID();

  let order: { id?: string; amount?: number; currency?: string; error?: Record<string, unknown> };
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: razorpayAuthHeader() },
      body: JSON.stringify({
        amount: TRACKING_CONFIG.amountPaise,
        currency: TRACKING_CONFIG.currency,
        receipt: `eon_${Date.now()}`,
        notes: writeOrderNotes(ORDER_KIND, leadId, email, ctx),
      }),
    });
    order = await res.json();

    if (!res.ok || !order?.id) {
      /* Flattened onto ONE line: a pretty-printed object gets its tail cut by
         the host's log viewer, and the tail is where Razorpay puts
         `description` and `field`. */
      const err = order?.error ?? {};
      /* A 401 is never about the payload, so the credentials' SHAPE is logged
         beside it: lengths say nothing about the secret while catching a mixed
         test/live pair, a pasted space, or the two values swapped. */
      if (res.status === 401) {
        console.error(
          `[create-order] auth shape keyIdPrefix=${keyId.slice(0, 9)} ` +
            `keyIdLen=${keyId.length} secretLen=${keySecret.length} ` +
            `secretLooksLikeKeyId=${keySecret.startsWith("rzp_")}`,
        );
      }
      console.error(
        `[create-order] razorpay rejected http=${res.status} code=${String(err.code ?? "?")} ` +
          `field=${String(err.field ?? "-")} desc=${String(err.description ?? JSON.stringify(order))}`,
      );
      return NextResponse.json({ ok: false, reason: "gateway" }, { status: 502 });
    }
  } catch (e) {
    console.error("[create-order] failed", e);
    return NextResponse.json({ ok: false, reason: "network" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    leadId,
    isTest: isTestMode(),
    orderId: String(order.id),
    amount: order.amount,
    currency: order.currency,
    keyId, // publishable by design: the browser needs it to open the sheet
  });
}
