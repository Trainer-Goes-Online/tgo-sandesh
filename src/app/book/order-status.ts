import { razorpayAuthHeader, razorpayReady } from "@/lib/checkout-config";

/**
 * SERVER-ONLY. "Has this order actually been paid?", asked by the booking page
 * while it renders, before it shows anyone a calendar.
 *
 * WHY THIS EXISTS RATHER THAN A CALL TO /api/razorpay/order-status: that route
 * is for the BROWSER, which polls it from the checkout while the payment sheet
 * is open, over a relative URL. A Server Component cannot fetch a relative URL,
 * so calling it from here would mean building an absolute origin out of
 * NEXT_PUBLIC_SITE_URL, which is blank until launch and falls back to
 * example.com. The booking page would then quietly fail to confirm every real
 * payment while looking completely healthy. So this asks Razorpay directly,
 * with the same credentials and the same test, and the route keeps serving the
 * browser.
 *
 * The two must agree, and they agree on one line: Razorpay moves an order to
 * `paid` only when the full amount is captured, which is the same moment the
 * `payment.captured` webhook fires. If that test ever changes, change it in
 * BOTH src/app/api/razorpay/order-status/route.ts and here.
 *
 * WHAT THIS IS NOT: it is not proof for anything that matters. Meta's Purchase
 * and GA4's server-side purchase come from the signature-verified webhook and
 * from nowhere else. This decides one thing: what the buyer is shown.
 */

/** Razorpay ids: a prefix followed by an alphanumeric handle. Both are shape
 *  checked before they are put in a URL, so neither query parameter can be
 *  bent into a path against Razorpay's API. */
const ORDER_ID = /^order_[A-Za-z0-9]{6,32}$/;
const PAYMENT_ID = /^pay_[A-Za-z0-9]{6,32}$/;

/* A hanging Razorpay call would hang the page render, and this page is the
   first thing a buyer sees after being charged. Six seconds, then fall through
   to "unconfirmed", which still shows them a calendar. */
const TIMEOUT_MS = 6000;

export type UnconfirmedReason =
  /** Someone opened /book with no query string at all. */
  | "no-order-id"
  /** An order id that is not shaped like a Razorpay one. */
  | "bad-order-id"
  /** Our own keys are missing, so nothing can be checked. */
  | "not-configured"
  /** Razorpay could not be reached, or answered with an error. */
  | "gateway";

export type BookingState =
  /** Razorpay says the money is captured. */
  | { status: "paid"; paymentId: string }
  /** Razorpay knows this order and says it has NOT been paid. */
  | { status: "unpaid" }
  /** We could not find out either way. */
  | { status: "unconfirmed"; reason: UnconfirmedReason };

export async function readBookingState(
  orderId: string,
  queryPaymentId: string,
): Promise<BookingState> {
  if (!orderId) return { status: "unconfirmed", reason: "no-order-id" };
  if (!ORDER_ID.test(orderId)) return { status: "unconfirmed", reason: "bad-order-id" };
  if (!razorpayReady()) return { status: "unconfirmed", reason: "not-configured" };

  const headers = { authorization: razorpayAuthHeader() };

  try {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { status: "unconfirmed", reason: "gateway" };

    const order = await res.json();
    /* Anything short of `paid` (`created`, `attempted`) means the buyer did not
       finish. That is a KNOWN negative, not an unknown, and it is shown
       differently: an unknown still gets a calendar, a known negative does
       not. */
    if (order?.status !== "paid") return { status: "unpaid" };

    /* The payment id decides what GA4's browser-side purchase is keyed on, so
       it is taken from Razorpay rather than from the query string wherever
       possible: `?p=` is typed as easily as it is redirected to, and a made-up
       transaction id would poison the dedup between this event and the
       webhook's server-side one, which keys on the real payment id.

       The query value is only the fallback, and only if it is shaped like a
       Razorpay payment id. It is a real fallback rather than a theoretical
       one: Razorpay's own success handler hands the checkout a payment id
       directly, and this listing call can fail on its own. */
    let paymentId = PAYMENT_ID.test(queryPaymentId) ? queryPaymentId : "";
    try {
      const pr = await fetch(
        `https://api.razorpay.com/v1/orders/${orderId}/payments`,
        { headers, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      const pl = await pr.json();
      const items: Array<{ id?: string; status?: string }> = pl?.items ?? [];
      const captured = items.find((p) => p.status === "captured")?.id ?? "";
      if (PAYMENT_ID.test(captured)) paymentId = captured;
    } catch {
      /* A missing payment id must never withhold the calendar from someone who
         has paid. The order is confirmed paid; only the GA4 key is lost, and
         the webhook reports that sale regardless. */
    }

    return { status: "paid", paymentId };
  } catch (e) {
    console.error("[book] order lookup failed", e);
    return { status: "unconfirmed", reason: "gateway" };
  }
}
