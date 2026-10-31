import { NextResponse } from "next/server";

import { ORDER_ID, fetchOrder, fetchOrderPayments, isPaidStatus } from "@/lib/purchase";
import { razorpayReady } from "@/lib/tracking-config";

/**
 * "Has this order been paid yet?", polled by the checkout while the Razorpay
 * sheet is open (and for a grace window after it closes).
 *
 * It exists for the UPI buyer who approves inside their bank app: Razorpay's
 * success handler can be slow, or never fire if the sheet was dismissed on the
 * way back, and that buyer has still paid. Whichever notices first, the
 * handler or this poll, moves them to /book.
 *
 * It decides what the buyer is SHOWN, nothing more. Purchase comes from the
 * signature-checked verify route and webhook.
 */
export async function GET(req: Request) {
  const headers = { "cache-control": "no-store" };
  if (!razorpayReady()) {
    return NextResponse.json({ ok: false, reason: "not-configured" }, { status: 503, headers });
  }

  const orderId = new URL(req.url).searchParams.get("order_id") ?? "";
  if (!ORDER_ID.test(orderId)) {
    return NextResponse.json({ ok: false, reason: "bad-order-id" }, { status: 400, headers });
  }

  const order = await fetchOrder(orderId);
  if (!order) return NextResponse.json({ ok: false, reason: "gateway" }, { status: 502, headers });

  const payments = await fetchOrderPayments(orderId);
  const paid = payments.find((p) => isPaidStatus(p.status));
  if (order.status !== "paid" && !paid) {
    return NextResponse.json({ ok: true, paid: false }, { headers });
  }
  return NextResponse.json({ ok: true, paid: true, paymentId: paid?.id ?? "" }, { headers });
}
