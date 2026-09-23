import crypto from "crypto";

import { NextResponse } from "next/server";

import {
  ATTR_COOKIE,
  packJsonNote,
  readAttrCookie,
} from "@/lib/attribution-edge";
import {
  CHECKOUT_CONFIG,
  isTestMode,
  razorpayAuthHeader,
  razorpayReady,
} from "@/lib/checkout-config";
import { ORDER_KIND } from "@/lib/funnel";
import {
  readClientIp,
  readClientUserAgent,
  readRequestCookie,
} from "@/lib/request-signals";

/**
 * Creates the Razorpay order the browser then pays.
 *
 * THE NOTES ARE THE POINT. The webhook that fires Purchase receives only what
 * Razorpay stored, and this is also the last request the buyer's own browser
 * makes, so it is the only honest place to read their IP, user agent and
 * cookies.
 *
 * Razorpay allows 15 note keys at 256 chars each and REJECTS the order if
 * either limit is passed. The record is written ONE FIELD PER KEY, with three
 * small packJsonNote bundles, so an oversized value can only cost its own
 * field.
 */

const truncate = (v: unknown, max = 256) => {
  const s = v == null ? "" : String(v);
  return s.length > max ? s.slice(0, max) : s;
};

export async function POST(req: Request) {
  if (!razorpayReady()) {
    console.error("[create-order] Razorpay keys not configured");
    return NextResponse.json(
      { ok: false, reason: "not-configured" },
      { status: 503 },
    );
  }
  const { keyId, keySecret } = CHECKOUT_CONFIG.razorpay;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const firstName = truncate(body.firstName, 80).trim();
  const lastName = truncate(body.lastName, 80).trim();
  const email = truncate(body.email, 160).trim();
  const phone = truncate(body.phone, 20).replace(/\D/g, "");
  const city = truncate(body.city, 80).trim();
  const country = truncate(body.country, 2).trim().toLowerCase() || "in";

  if (!firstName || !lastName || !email || !phone || !city) {
    return NextResponse.json(
      { ok: false, reason: "missing-fields" },
      { status: 400 },
    );
  }

  const utm = (body.utm ?? {}) as Record<string, string | undefined>;

  /* Identity for the fulfilment record, minted before payment. No timestamp
     travels with it: the webhook reads Razorpay's `payment.created_at`. */
  const leadId = crypto.randomUUID();

  /* Read from headers, never from the request body: the browser cannot know
     its own IP, and a user agent sent up in JSON is trivially forged. */
  const clientIp = readClientIp(req);
  const clientUserAgent = readClientUserAgent(req);

  /* Same-origin, so the buyer's cookies arrive on this request. Body first,
     because it may hold an `_fbc` synthesised from an fbclid before Meta's own
     cookie existed; cookie second, because it survives a blocked pixel. */
  const fbc = truncate(body.fbc) || truncate(readRequestCookie(req, "_fbc"));
  const fbp = truncate(body.fbp) || truncate(readRequestCookie(req, "_fbp"));

  /* The attribution the EDGE recorded, before any JavaScript ran. The body's
     copy comes from localStorage, which in-app browsers restrict, so this is
     the reliable half and the body is the fallback. */
  const edge = readAttrCookie(readRequestCookie(req, ATTR_COOKIE));

  /* 256, not 300: that is Razorpay's own per-note ceiling and `lp` is one
     note. Everything past it is query string, and every part of that which
     matters already rides in `utm` and `clid`. */
  const landingUrl =
    truncate(body.landingUrl, 256) || truncate(edge.landingUrl, 256);
  const referrer = truncate(body.referrer, 200) || truncate(edge.referrer, 200);
  const fbclid = truncate(body.fbclid, 200) || truncate(edge.fbclid, 200);
  const utmOf = (bodyVal: string | undefined, edgeVal: string | undefined) =>
    truncate(bodyVal, 100) || truncate(edgeVal, 100);

  /* FOURTEEN KEYS against Razorpay's limit of fifteen. One field per key, so
     an oversized value can only ever cost its own field. */
  const notes: Record<string, string> = {
    /* One constant, read by the webhook too, so the funnel gate there cannot
       drift from what is written here. */
    kind: ORDER_KIND,
    lead_id: leadId,
    /* Readable in the Razorpay dashboard, for whoever opens a payment trying
       to work out whose refund it is. */
    name: truncate(`${firstName} ${lastName}`.trim()),
    email: truncate(email),
    /* No `phone` key: Razorpay returns `payment.contact`, the number the buyer
       actually paid with. */

    /* The per-field caps below are the real fix, not packJsonNote: that is a
       last resort which shortens a bundle's LONGEST value until it fits, so a
       bundle crowded at theoretical maxima loses several fields at once. */
    cust: packJsonNote({
      fn: truncate(firstName, 40),
      ln: truncate(lastName, 40),
      ct: truncate(city, 40),
      co: country,
      dl: truncate(body.dialCode, 6),
    }),
    meta: packJsonNote({
      xid: truncate(body.externalId, 40),
      ga: truncate(body.gaClientId, 40),
    }),
    /* TGO's ad urls carry Meta NAMES in medium, campaign and content
       ({{campaign.name}}, {{adset.name}}, {{ad.name}}), which run to sixty
       characters in an agency account, and the ad id in term. 20/55/55/55/25
       serialises to 246 of the 256 available; the id gets 25 because a
       truncated id joins to nothing while still looking valid. */
    utm: packJsonNote({
      s: truncate(utmOf(utm.source, edge.utmSource), 20),
      m: truncate(utmOf(utm.medium, edge.utmMedium), 55),
      c: truncate(utmOf(utm.campaign, edge.utmCampaign), 55),
      n: truncate(utmOf(utm.content, edge.utmContent), 55),
      t: truncate(utmOf(utm.term, edge.utmTerm), 25),
    }),
    fbc,
    fbp,
    ip: clientIp,
    ua: truncate(clientUserAgent, 256),
    clid: fbclid,
    ref: referrer,
    lp: landingUrl,
  };

  /* A rejected order is an unpaid buyer, so the length limit is repaired
     rather than merely logged. */
  for (const [k, v] of Object.entries(notes)) {
    if (v.length > 256) {
      console.error(
        `[create-order] note "${k}" over 256 chars (${v.length}), trimming`,
      );
      notes[k] = v.slice(0, 256);
    }
  }
  if (Object.keys(notes).length > 15) {
    console.error(
      "[create-order] notes over Razorpay 15-key cap",
      Object.keys(notes).length,
    );
  }

  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: razorpayAuthHeader(),
      },
      body: JSON.stringify({
        amount: CHECKOUT_CONFIG.amountPaise,
        currency: CHECKOUT_CONFIG.currency,
        receipt: `eon_${Date.now()}`,
        notes,
      }),
    });

    const order = await res.json();
    if (!res.ok || !order?.id) {
      /* Flattened onto ONE line on purpose: a pretty-printed object gets its
         tail truncated by the host's log viewer, and the tail is where
         Razorpay puts `description` and `field`. */
      const err = order?.error ?? {};
      /* A 401 is never about the payload, so the credentials' SHAPE is logged
         beside it: lengths and trimmed-flags say nothing about the secret
         while catching a mixed test/live pair, a pasted space, a regenerated
         secret and the two values entered the wrong way round. */
      if (res.status === 401) {
        console.error(
          `[create-order] auth shape keyIdPrefix=${keyId.slice(0, 9)} ` +
            `keyIdLen=${keyId.length} (expect 23) secretLen=${keySecret.length} (expect 24) ` +
            `keyIdClean=${keyId === keyId.trim()} secretClean=${keySecret === keySecret.trim()} ` +
            `secretLooksLikeKeyId=${keySecret.startsWith("rzp_")}`,
        );
      }
      console.error(
        `[create-order] razorpay rejected http=${res.status} code=${err.code ?? "?"} ` +
          `step=${err.step ?? "?"} field=${err.field ?? "-"} desc=${err.description ?? JSON.stringify(order)}`,
      );
      return NextResponse.json({ ok: false, reason: "gateway" }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      leadId,
      isTest: isTestMode(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId, // publishable by design: the browser needs it to open the sheet
    });
  } catch (e) {
    console.error("[create-order] failed", e);
    return NextResponse.json({ ok: false, reason: "network" }, { status: 502 });
  }
}
