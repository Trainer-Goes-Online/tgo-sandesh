import crypto from "crypto";

import { NextResponse } from "next/server";

import { ORDER_KIND } from "@/lib/funnel";
import { notesOf, sendPurchaseCapi, sendPurchasePabbly, type RzpPayment } from "@/lib/purchase";
import { TRACKING_CONFIG } from "@/lib/tracking-config";

/**
 * Razorpay webhook: Meta CAPI Purchase and the Pabbly "purchase" row.
 *
 * THE AUTHORITATIVE PURCHASE. A browser-side signal misses every UPI payer who
 * completes inside a bank app and never returns to the tab; this is the only
 * place the payment is proven whether or not the buyer comes back. The
 * checkout's /api/razorpay/verify sends the same Purchase (same event_id, the
 * payment id) from the buyer's browser, and Meta collapses the two.
 *
 * This request's own IP and user agent are deliberately NOT read; they are
 * Razorpay's. The buyer's come from the order notes.
 *
 * Register at: <site>/api/razorpay/webhook, event `payment.captured`, with a
 * secret from Razorpay Settings -> Webhooks (a DIFFERENT value from the API
 * keys) in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = TRACKING_CONFIG.razorpay.webhookSecret;

  if (!secret) {
    console.error("[rzp-webhook] no webhook secret configured");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  /* Length checked first: timingSafeEqual THROWS on unequal lengths, and a
     throw inside a webhook is a 500, which Razorpay retries. */
  const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  if (!valid) {
    console.warn("[rzp-webhook] bad signature, rejected");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let parsed: { event?: string; payload?: { payment?: { entity?: RzpPayment } } };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true, ignored: "bad-json" });
  }
  if (parsed.event !== "payment.captured") {
    // Razorpay sends many event types; only a captured payment is a Purchase.
    return NextResponse.json({ ok: true, ignored: parsed.event });
  }

  const payment = parsed.payload?.payment?.entity ?? {};

  /* IS THIS SALE EVEN OURS? A signature proves the call came from Razorpay,
     never that the payment came from THIS checkout: Razorpay sends every
     subscribed event to every registered URL on the account. 200, not an
     error: a non-200 makes Razorpay retry a foreign payment for hours. */
  const kind = String(notesOf(payment.notes).kind ?? "");
  if (kind !== ORDER_KIND) {
    console.warn(`[rzp-webhook] ignored ${String(payment.id ?? "")}: kind="${kind || "none"}"`);
    return NextResponse.json({ ok: true, ignored: "not-this-funnel" });
  }

  /* Fulfilment first, and independent of Meta: a missing CAPI config must
     never stop a paying buyer being recorded. */
  const pabbly = await sendPurchasePabbly(payment);
  const capi = await sendPurchaseCapi(payment);

  console.log(`[rzp-webhook] ${String(payment.id)} Purchase capi=${capi.ok} pabbly=${pabbly.ok}`);
  /* Always 200 once the signature is valid. A non-200 makes Razorpay retry
     the whole webhook, which re-sends the Pabbly row. */
  return NextResponse.json({ ok: true, capi: capi.ok, pabbly: pabbly.ok });
}
