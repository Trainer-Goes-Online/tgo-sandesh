import crypto from "crypto";

import { NextResponse } from "next/server";

import { ORDER_KIND } from "@/lib/funnel";
import {
  ORDER_ID,
  PAYMENT_ID,
  fetchPayment,
  isPaidStatus,
  notesOf,
  sendPurchaseCapi,
} from "@/lib/purchase";
import { readClientIp, readClientUserAgent, readRequestCookie } from "@/lib/request-signals";
import { TRACKING_CONFIG, razorpayReady } from "@/lib/tracking-config";

/**
 * Called by the checkout from Razorpay's success handler, BEFORE it moves the
 * buyer to /book.
 *
 * It does one thing the webhook cannot: it fires Meta's Purchase from the
 * BUYER's own request, so the CAPI copy carries their live IP, user agent and
 * cookies. It is also what keeps Purchase working on a deployment whose
 * webhook is not registered yet (or on localhost, which Razorpay cannot reach).
 *
 * Proven twice before anything is sent: Razorpay's checkout signature
 * (HMAC-SHA256 of `order_id|payment_id` with the key secret), then the payment
 * itself, fetched from Razorpay, must be paid and must be this funnel's.
 *
 * event_id is the payment id, the same as the webhook's and the browser
 * pixel's, so Meta counts the sale once however many of the three arrive.
 * Pabbly's purchase row is NOT sent here: the webhook owns it, so a sale is one
 * row.
 */
export async function POST(req: Request) {
  if (!razorpayReady()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const orderId = String(body.razorpay_order_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");
  if (!ORDER_ID.test(orderId) || !PAYMENT_ID.test(paymentId) || !/^[a-f0-9]{64}$/.test(signature)) {
    return NextResponse.json({ ok: false, reason: "bad-input" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", TRACKING_CONFIG.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    console.warn(`[rzp-verify] bad signature for ${paymentId}`);
    return NextResponse.json({ ok: false, reason: "bad-signature" }, { status: 401 });
  }

  const payment = await fetchPayment(paymentId);
  if (!payment || payment.order_id !== orderId) {
    return NextResponse.json({ ok: false, reason: "gateway" }, { status: 502 });
  }
  if (!isPaidStatus(payment.status)) {
    return NextResponse.json({ ok: true, paid: false, status: payment.status });
  }
  if (String(notesOf(payment.notes).kind ?? "") !== ORDER_KIND) {
    return NextResponse.json({ ok: true, paid: true, capi: "not-this-funnel" });
  }

  const capi = await sendPurchaseCapi(payment, {
    clientIp: readClientIp(req),
    clientUserAgent: readClientUserAgent(req),
    fbc: readRequestCookie(req, "_fbc"),
    fbp: readRequestCookie(req, "_fbp"),
  });

  console.log(`[rzp-verify] ${paymentId} Purchase capi=${capi.ok}`);
  return NextResponse.json({ ok: true, paid: true, paymentId, capi: capi.ok });
}
