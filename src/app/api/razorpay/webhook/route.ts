import crypto from "crypto";

import { NextResponse } from "next/server";

import { logError, logInfo, logWarn } from "@/lib/log";
import { ORDER_KIND } from "@/lib/funnel";
import { notesOf, sendPurchaseCapi, sendPurchasePabbly, type RzpPayment } from "@/lib/purchase";
import { TRACKING_CONFIG } from "@/lib/tracking-config";

/**
 * Razorpay webhook: Meta CAPI Purchase and the Pabbly "purchase" row.
 *
 * THE AUTHORITATIVE PURCHASE. A browser-side signal misses every UPI payer who
 * completes inside a bank app and never returns to the tab; this is the only
 * place the payment is proven whether or not the buyer comes back. The
 * Purchase is sent from nowhere else (no browser pixel, no verify route).
 *
 * This request's own IP and user agent are deliberately NOT read; they are
 * Razorpay's. The buyer's come from the order notes.
 *
 * Register at: https://transformmebro.com/api/razorpay/webhook, event `payment.captured`, with a
 * secret from Razorpay Settings -> Webhooks (a DIFFERENT value from the API
 * keys) in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = TRACKING_CONFIG.razorpay.webhookSecret;

  logInfo("rzp-webhook", "POST received", {
    bytes: raw.length,
    has_signature: Boolean(signature),
    secret_configured: Boolean(secret),
  });

  if (!secret) {
    logError("rzp-webhook", "REJECTED: RAZORPAY_WEBHOOK_SECRET is not set in this deployment");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  /* Length checked first: timingSafeEqual THROWS on unequal lengths, and a
     throw inside a webhook is a 500, which Razorpay retries. */
  const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  if (!valid) {
    logWarn("rzp-webhook", "bad signature, rejected", {
      hint: "secret in Vercel must equal the secret on this webhook in Razorpay, same mode (live/test); redeploy after changing it",
      secret_len: secret.length,
      signature_len: signature.length,
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let parsed: { event?: string; payload?: { payment?: { entity?: RzpPayment } } };
  try {
    parsed = JSON.parse(raw);
  } catch {
    logWarn("rzp-webhook", "ignored: body is not JSON");
    return NextResponse.json({ ok: true, ignored: "bad-json" });
  }
  if (parsed.event !== "payment.captured") {
    // Razorpay sends many event types; only a captured payment is a Purchase.
    logInfo("rzp-webhook", "signature OK, ignored event type", { event: parsed.event });
    return NextResponse.json({ ok: true, ignored: parsed.event });
  }

  const payment = parsed.payload?.payment?.entity ?? {};

  /* IS THIS SALE EVEN OURS? A signature proves the call came from Razorpay,
     never that the payment came from THIS checkout: Razorpay sends every
     subscribed event to every registered URL on the account. 200, not an
     error: a non-200 makes Razorpay retry a foreign payment for hours. */
  const kind = String(notesOf(payment.notes).kind ?? "");
  if (kind !== ORDER_KIND) {
    logWarn("rzp-webhook", "signature OK, ignored: payment is not from this funnel", {
      payment_id: String(payment.id ?? ""),
      kind: kind || "none",
    });
    return NextResponse.json({ ok: true, ignored: "not-this-funnel" });
  }

  /* Fulfilment first, and independent of Meta: a missing CAPI config must
     never stop a paying buyer being recorded. */
  logInfo("rzp-webhook", "payment.captured accepted (this funnel)", {
    payment_id: String(payment.id ?? ""),
    order_id: String(payment.order_id ?? ""),
    amount_rupees: Number(payment.amount ?? 0) / 100,
  });
  const pabbly = await sendPurchasePabbly(payment);
  const capi = await sendPurchaseCapi(payment);

  logInfo("rzp-webhook", "DONE", {
    payment_id: String(payment.id ?? ""),
    meta_purchase: capi.ok ? "sent" : "FAILED/skipped",
    pabbly: pabbly.ok ? "sent" : "FAILED/skipped",
  });
  /* Always 200 once the signature is valid. A non-200 makes Razorpay retry
     the whole webhook, which re-sends the Pabbly row. */
  return NextResponse.json({ ok: true, capi: capi.ok, pabbly: pabbly.ok });
}
