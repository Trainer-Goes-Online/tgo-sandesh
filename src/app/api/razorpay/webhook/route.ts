import crypto from "crypto";

import { NextResponse } from "next/server";

import { CHECKOUT_CONFIG, capiReady, isTestMode } from "@/lib/checkout-config";
import { GA4_ITEM_ID, ORDER_KIND, bookingHref } from "@/lib/funnel";
import { ga4ServerReady, sendGa4Purchase } from "@/lib/ga4-server";
import { sendCapiEvent } from "@/lib/meta-capi";
import { readOrderContext } from "@/lib/order-notes";
import { pabblyReady, sendPabblyPurchase } from "@/lib/pabbly";

/**
 * Razorpay webhook to Meta CAPI Purchase and GA4 purchase.
 *
 * PURCHASE IS SENT FROM HERE AND NOWHERE ELSE: a browser-side Purchase misses
 * every UPI payer who completes inside a bank app, and this is the only place
 * the payment is proven rather than attempted. This request's own IP and user
 * agent are deliberately NOT read; they are Razorpay's.
 *
 * Register at: <site>/api/razorpay/webhook, event `payment.captured`, with a
 * secret from Razorpay Settings -> Webhooks (a DIFFERENT value from the API
 * keys).
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = CHECKOUT_CONFIG.razorpay.webhookSecret;

  if (!secret) {
    console.error("[rzp-webhook] no webhook secret configured");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  /* Length checked first: timingSafeEqual THROWS on unequal lengths, and a
     throw inside a webhook is a 500, which Razorpay retries forever. */
  const valid =
    sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

  if (!valid) {
    console.warn("[rzp-webhook] bad signature, rejected");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = JSON.parse(raw);
  if (parsed.event !== "payment.captured") {
    // Razorpay sends many event types; only a captured payment is a Purchase.
    return NextResponse.json({ ok: true, ignored: parsed.event });
  }

  const payment = parsed.payload?.payment?.entity ?? {};
  const notes = payment.notes ?? {};

  /* IS THIS SALE EVEN OURS? A signature proves the call came from Razorpay,
     never that the payment came from THIS checkout. Razorpay registers
     webhooks per URL on an ACCOUNT and sends every subscribed event to every
     registered URL, so this endpoint also receives another funnel's payments,
     dashboard payment links, invoices and renewals. `notes.kind` is this
     funnel's mark, written on the order at create time.

     200, not an error: a non-200 makes Razorpay retry the same foreign
     payment for hours. This is a correct, final "not mine". */
  const kind = String(notes.kind ?? "");
  if (kind !== ORDER_KIND) {
    console.warn(
      `[rzp-webhook] ignored payment ${String(payment.id ?? "")}: kind="${kind || "none"}", expected "${ORDER_KIND}"`,
    );
    return NextResponse.json({ ok: true, ignored: "not-this-funnel" });
  }

  const paymentId = String(payment.id ?? "");
  const orderId = String(payment.order_id ?? "");
  const amountRupees = Number(payment.amount ?? 0) / 100;

  /* Razorpay's own amount is authoritative: it is what was actually charged.
     The configured price is the fallback for a malformed payload only. */
  const valueRupees = amountRupees || CHECKOUT_CONFIG.amountRupees;

  /* Razorpay's own capture time, in Unix seconds, so no date has to be ferried
     through the notes. For a UPI buyer it is minutes after the form was
     submitted, which is what the record used to carry. */
  const capturedAt = Number(payment.created_at ?? 0);
  const createdAt =
    Number.isFinite(capturedAt) && capturedAt > 0
      ? new Date(capturedAt * 1000).toISOString()
      : new Date().toISOString();

  /* The only route back to the buyer's own IP, user agent, campaign and
     landing page: this request came from Razorpay. */
  const ctx = readOrderContext(notes);
  const country = ctx.country || "in";

  /* Razorpay is the authority on email and phone: it holds what the buyer
     actually paid with, which can differ from what they typed into the form. */
  const email = String(payment.email ?? "") || "";
  const phone = String(payment.contact ?? "") || "";

  /* Origin only, for the same reason Meta gets origin only: a path is a
     description, and this offer is sold against a body. */
  const eventSourceUrl = CHECKOUT_CONFIG.fallbackEventSourceUrl;

  /* Keyed on the payment id, like the browser copy on the booking page, so GA4
     collapses the pair rather than counting the sale twice. */
  const ga4 = ga4ServerReady()
    ? await sendGa4Purchase({
        clientId: ctx.gaCid,
        transactionId: paymentId,
        valueRupees,
        currency: CHECKOUT_CONFIG.currency,
        itemId: GA4_ITEM_ID,
        itemName: CHECKOUT_CONFIG.itemName,
      })
    : { ok: false, status: 0 };

  /* FULFILMENT HAND-OFF, ABOVE the CAPI guard below on purpose: that guard
     returns early when Meta is not configured, and fulfilment must never
     depend on analytics being switched on. Its failure is swallowed, because a
     non-200 from here makes Razorpay retry and double-count the sale. */
  const pabbly = pabblyReady()
    ? await sendPabblyPurchase({
        leadId: String(notes.lead_id ?? ""),
        createdAt,
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        email,
        phone,
        city: ctx.city,
        dialCode: ctx.dialCode,
        countryCode: country,
        fbc: ctx.fbc,
        fbp: ctx.fbp,
        clientIp: ctx.clientIp,
        clientUserAgent: ctx.clientUserAgent,
        externalId: ctx.externalId,
        eventSourceUrl: `${eventSourceUrl}/checkout`,
        amountRupees: valueRupees,
        isTest: isTestMode(),
        /* The same id Meta gets as the Purchase event_id, so a conversion can
           be traced from the sheet or replayed against it. */
        purchaseEventId: paymentId,
        utmSource: ctx.utmSource,
        utmMedium: ctx.utmMedium,
        utmCampaign: ctx.utmCampaign,
        utmContent: ctx.utmContent,
        utmTerm: ctx.utmTerm,
        fbclid: ctx.fbclid,
        referrer: ctx.referrer,
        landingUrl: ctx.landingUrl,
        paymentId,
        orderId,
        currency: CHECKOUT_CONFIG.currency,
        product: CHECKOUT_CONFIG.itemName,

        /* Always "" here: this checkout asks no qualifying question. Emitted
           so the Pabbly column set matches the other funnels. */
        occupation: "",
        /* Absolute, because whatever re-sends it is not on our domain. Built
           from the helper the checkout redirects with, so the two cannot
           drift. */
        bookingUrl: `${eventSourceUrl}${bookingHref(paymentId, orderId)}`,
      })
    : { ok: false, status: 0 };

  if (!capiReady()) {
    console.warn("[rzp-webhook] CAPI not configured, Meta Purchase not sent");
    return NextResponse.json({
      ok: true,
      capi: "skipped",
      ga4: ga4.ok,
      pabbly: pabbly.ok,
    });
  }

  /* event_id is the payment id: unique per payment, and stable if Razorpay
     retries the webhook, so a retry cannot double-count the sale. */
  const result = await sendCapiEvent({
    pixelId: CHECKOUT_CONFIG.meta.pixelId,
    accessToken: CHECKOUT_CONFIG.meta.accessToken,
    eventName: "Purchase",
    eventId: paymentId,
    eventSourceUrl,
    user: {
      email: email || undefined,
      phone: phone || undefined,
      firstName: ctx.firstName || undefined,
      lastName: ctx.lastName || undefined,
      country,
      city: ctx.city || undefined,
      externalId: ctx.externalId || undefined,
      fbc: ctx.fbc || undefined,
      fbp: ctx.fbp || undefined,
      /* Captured from the BUYER's request at create-order and carried here. */
      clientIp: ctx.clientIp || undefined,
      clientUserAgent: ctx.clientUserAgent || undefined,
    },
    valueRupees,
    currency: CHECKOUT_CONFIG.currency,
    /* The only descriptive field Meta receives, and it is an opaque Razorpay
       id. custom_data is unhashed and IS read during dataset classification,
       so the product name, the UTMs and the path are never sent. */
    orderId: orderId || undefined,
    testEventCode: CHECKOUT_CONFIG.meta.testEventCode || undefined,
  });

  console.log(
    `[rzp-webhook] ${paymentId} Purchase capi=${result.ok} ga4=${ga4.ok} pabbly=${pabbly.ok}`,
  );
  /* Always 200 once the signature is valid. A non-200 makes Razorpay retry the
     whole webhook, which re-fires Meta and GA4 and double-counts the sale. */
  return NextResponse.json({
    ok: true,
    capi: result.ok ? "sent" : "error",
    ga4: ga4.ok ? "sent" : "skipped",
    pabbly: pabbly.ok ? "sent" : "skipped",
  });
}
