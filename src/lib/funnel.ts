/**
 * Funnel constants that BOTH halves of the app need: the browser bundle and
 * the server routes. Nothing here reads a secret, so it is safe on both sides.
 *
 *   /  ->  CTA (AddToCart)  ->  /checkout (InitiateCheckout on Pay)
 *      ->  Razorpay (Purchase)  ->  /book (Schedule)  ->  /thank-you
 *
 * The PRICE is NOT declared here. It lives in `src/app/_legal/legal.ts`, read
 * from NEXT_PUBLIC_CHECKOUT_PRICE_INR.
 */

/** Where every landing-page CTA goes. */
export const CHECKOUT_HREF = "/checkout";

/** Where a paid buyer lands, to pick a slot. */
export const BOOKING_HREF = "/book";

/**
 * The booking url for a specific payment.
 *
 * `o` is the one that matters: the booking page asks Razorpay whether that
 * ORDER is actually paid before it shows a calendar, because a query string is
 * typed as easily as it is redirected to. `p` is carried as a fallback for the
 * browser-side Purchase key.
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
 * The `kind` note on every Razorpay order. The webhook ignores any payment
 * without it: Razorpay sends every account event to every registered URL, so
 * this endpoint also receives other funnels' payments. Stable string: changing
 * it orphans every historical order from any filter built on it.
 */
export const ORDER_KIND = "sandesh_eon_strategy_call";
