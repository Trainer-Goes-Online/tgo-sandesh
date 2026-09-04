import crypto from "crypto";

import { NextResponse } from "next/server";

import { CHECKOUT_CONFIG, capiReady, isTestMode } from "@/lib/checkout-config";
import { GA4_ITEM_ID, bookingHref } from "@/lib/funnel";
import { ga4ServerReady, sendGa4Purchase } from "@/lib/ga4-server";
import { sendCapiEvent } from "@/lib/meta-capi";
import { unpackContext } from "@/lib/order-notes";
import { pabblyReady, sendPabblyPurchase } from "@/lib/pabbly";

/**
 * Razorpay webhook to Meta CAPI Purchase and GA4 purchase.
 *
 * PURCHASE IS SENT FROM HERE AND NOWHERE ELSE. A browser-side Purchase would
 * miss every UPI payer who completes inside their bank app and never returns
 * to the tab, which in India is most of them. It is also the only place the
 * payment is proven rather than merely attempted: the checkout's Razorpay
 * success handler and the order-status poll both only navigate.
 *
 * The signature check is not optional. Without it anyone who learns this URL
 * can post a fake payment and inflate Meta's conversion data, which then
 * teaches the ad account to buy the wrong people.
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
  const paymentId = String(payment.id ?? "");
  const orderId = String(payment.order_id ?? "");
  const amountRupees = Number(payment.amount ?? 0) / 100;

  /* Razorpay's own amount is authoritative: it is what was actually charged.
     The configured price is the fallback for a malformed payload only. */
  const valueRupees = amountRupees || CHECKOUT_CONFIG.amountRupees;

  /* Everything the browser knew, written into the order at create time and
     unpacked here. This is the ONLY route back to the buyer's own IP, user
     agent, campaign and landing page: THIS request came from Razorpay, so its
     own headers describe Razorpay. */
  const ctx = unpackContext(notes);
  const country = ctx.country || "in";

  /* Razorpay is the authority on email and phone: it holds what the buyer
     actually paid with, which can differ from what they typed into the form. */
  const email = String(payment.email ?? "") || "";
  const phone = String(payment.contact ?? "") || "";

  /* Origin only, for the same reason Meta gets origin only: a path is a
     description, and this offer is sold against a body. */
  const eventSourceUrl = CHECKOUT_CONFIG.fallbackEventSourceUrl;

  /* GA4 purchase, server side. The browser copy on the booking page only
     counts buyers who reach it, which a UPI payer may not. Both are keyed on
     the payment id, so GA4 collapses the pair rather than counting the sale
     twice when someone does arrive. */
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

  /* FULFILMENT HAND-OFF, and it sits ABOVE the CAPI guard below on purpose.
     That guard returns early when Meta is not configured, so a hand-off placed
     after it would mean a missing Meta token stops a paying buyer from being
     recorded and contacted. Fulfilment must never depend on analytics being
     switched on.

     Its own failure is swallowed. A non-200 returned from this webhook makes
     Razorpay retry the whole thing, which re-fires Meta and GA4 and
     double-counts the sale. sendPabblyPurchase therefore retries in process
     (nothing else ever will) and reports rather than throws. */
  const pabbly = pabblyReady()
    ? await sendPabblyPurchase({
        leadId: String(notes.lead_id ?? ""),
        createdAt: ctx.createdAt,
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        email,
        phone,
        city: ctx.city,
        countryCode: country,
        fbc: ctx.fbc,
        fbp: ctx.fbp,
        clientIp: ctx.clientIp,
        clientUserAgent: ctx.clientUserAgent,
        externalId: ctx.externalId,
        eventSourceUrl: `${eventSourceUrl}/checkout`,
        amountRupees: valueRupees,
        isTest: isTestMode(),
        /* The same id sent to Meta as the Purchase event_id, so a conversion
           can be traced from the sheet back to a specific row in Events
           Manager, or replayed against it. */
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

        /* Always "" here: this checkout asks no qualifying question. Emitted so the

           Pabbly column set matches the other funnels. */

        occupation: "",
        /* Absolute, because whatever re-sends this (an email, a WhatsApp
           message) is not on our domain. Built from the same helper the
           checkout redirects with, so the two can never drift. */
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
      /* Captured from the BUYER's request at create-order and carried here.
         Purchase is the one event where a missing device match costs the most:
         these two are worth roughly a point of EMQ on their own. */
      clientIp: ctx.clientIp || undefined,
      clientUserAgent: ctx.clientUserAgent || undefined,
    },
    valueRupees,
    currency: CHECKOUT_CONFIG.currency,
    /* The only descriptive field Meta receives, and it is an opaque Razorpay
       id. The product name, the UTMs and the path are deliberately NOT sent:
       custom_data is unhashed and IS read during dataset classification, and
       those are the values that describe what is being sold. */
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
