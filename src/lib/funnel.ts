/**
 * Funnel constants that BOTH halves of the app need: the browser bundle and
 * the server routes.
 *
 * Deliberately kept out of `checkout-config.ts`. That file reads secrets from
 * `process.env` and is server-only; importing it into a client component would
 * pull a module that references RAZORPAY_KEY_SECRET into the browser graph.
 * Nothing here reads env, so it is safe on both sides.
 *
 * The PRICE is NOT declared here. It lives in `src/app/_legal/legal.ts`, which
 * is the single source for it: the label the buyer reads, the paise Razorpay
 * charges and the `value` on every Meta and GA4 event all resolve from that one
 * number. Two sources drift, and the drift is invisible until the charge and
 * the label disagree on a live page.
 */

/**
 * Where a paid buyer lands.
 *
 * BUILT (pass 2): src/app/book/page.tsx, a Server Component that confirms the
 * order with Razorpay before it renders anything, and src/components/book/
 * BookingPage.tsx, which holds the calendar embed and fires GA4's browser-side
 * purchase. The calendar destination itself is
 * NEXT_PUBLIC_BOOKING_CALENDAR_URL; until that is set the page shows a labelled
 * stand-in where the slot picker goes.
 *
 * The checkout's own notice promises the buyer this: pay, wait up to ten
 * seconds without closing the tab, get taken to the calendar automatically.
 * `CheckoutForm` honours that in two independent ways (the Razorpay success
 * handler, and a poll against the order's real status), so the promise holds
 * even when the handler never fires.
 */
export const BOOKING_HREF = "/book";

/**
 * The booking url for a specific payment.
 *
 * Both ids ride along. `o` is the one that matters: the booking page must ask
 * the server whether that ORDER is actually paid before it shows a calendar,
 * because a query string is typed as easily as it is redirected to. `p` is
 * carried for the GA4 browser-side `purchase`, which is keyed on the payment id
 * so a reload cannot double-count the sale.
 */
export function bookingHref(paymentId: string, orderId: string): string {
  const q = new URLSearchParams();
  if (paymentId) q.set("p", paymentId);
  if (orderId) q.set("o", orderId);
  const s = q.toString();
  return s ? `${BOOKING_HREF}?${s}` : BOOKING_HREF;
}

/**
 * GA4's item identity. GA4 is not subject to the Meta classification posture
 * described in `lib/meta-capi.ts`, so a readable product name is fine here and
 * is what makes the ecommerce reports legible. Meta receives none of this.
 */
export const GA4_ITEM_ID = "sandesh-eon-strategy-call";

/**
 * The `kind` note on every Razorpay order, so the dashboard says what was
 * bought without opening the packed context. Stable string: changing it
 * orphans every historical order from any filter built on it.
 */
export const ORDER_KIND = "sandesh_eon_strategy_call";
