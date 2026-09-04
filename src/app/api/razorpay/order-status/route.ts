import { NextResponse } from "next/server";

import { razorpayAuthHeader, razorpayReady } from "@/lib/checkout-config";

/**
 * "Is this order paid yet?", asked by the checkout while the buyer is inside
 * the payment sheet.
 *
 * This route exists to keep a PROMISE THE CHECKOUT COPY MAKES: pay, wait up to
 * ten seconds without closing or refreshing the tab, and get taken to the
 * calendar automatically. Razorpay's own success `handler` covers the card and
 * netbanking path, but a UPI buyer approves inside their bank app, and the
 * handler can be slow to fire or never fire at all if the sheet was dismissed
 * on the way back. Without a second, independent way of noticing the payment,
 * that buyer sits on a checkout page that has already charged them.
 *
 * So the browser polls this while the sheet is open, and the first of the two
 * to notice the payment does the redirect.
 *
 * WHAT THIS IS NOT: it is not proof for anything that matters. Meta's Purchase
 * and GA4's server-side purchase are fired by the signature-verified webhook
 * and by nothing else, because a webhook is Razorpay telling us, while this is
 * us asking. This route only decides when to move the buyer to the next page.
 *
 * Exposure: it answers only for an order id the caller already holds, and it
 * returns a boolean and Razorpay's own payment id. It carries no PII and no
 * notes. The id is validated for shape before it is used, so this cannot be
 * turned into a proxy for arbitrary Razorpay API paths.
 */

/** Razorpay order ids are `order_` followed by an alphanumeric handle. */
const ORDER_ID = /^order_[A-Za-z0-9]{6,32}$/;

export async function GET(req: Request) {
  if (!razorpayReady()) {
    return NextResponse.json(
      { ok: false, reason: "not-configured" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const orderId = new URL(req.url).searchParams.get("order_id") ?? "";
  if (!ORDER_ID.test(orderId)) {
    return NextResponse.json(
      { ok: false, reason: "bad-order-id" },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const headers = { "cache-control": "no-store" };

  try {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { authorization: razorpayAuthHeader() },
      cache: "no-store",
    });
    const order = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: "gateway" }, { status: 502, headers });
    }

    /* Razorpay moves an order to `paid` only once the full amount is captured,
       which is the same moment the `payment.captured` webhook fires. Anything
       short of that (`created`, `attempted`) means the buyer has not finished. */
    const paid = order?.status === "paid";
    if (!paid) {
      return NextResponse.json({ ok: true, paid: false }, { headers });
    }

    /* Fetch the payment id only once the order is paid, so the ordinary
       poll is one API call rather than two. It is what the booking page keys
       its GA4 browser-side purchase on, and what makes a support request
       traceable back to a row in the dashboard. */
    let paymentId = "";
    try {
      const pr = await fetch(
        `https://api.razorpay.com/v1/orders/${orderId}/payments`,
        { headers: { authorization: razorpayAuthHeader() }, cache: "no-store" },
      );
      const pl = await pr.json();
      const items: Array<{ id?: string; status?: string }> = pl?.items ?? [];
      paymentId = items.find((p) => p.status === "captured")?.id ?? "";
    } catch {
      /* A missing payment id must not stop the redirect: the order is paid,
         and the booking page re-checks the order server-side anyway. */
    }

    return NextResponse.json({ ok: true, paid: true, paymentId }, { headers });
  } catch (e) {
    console.error("[order-status] failed", e);
    return NextResponse.json({ ok: false, reason: "network" }, { status: 502, headers });
  }
}
