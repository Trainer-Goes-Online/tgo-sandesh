/**
 * Funnel constants that BOTH halves of the app need: the browser bundle and
 * the server routes. Nothing here reads env, so it is safe on both sides.
 */

/** Where every landing-page CTA goes: the free call, booked straight on Cal. */
export const BOOKING_HREF = "/book";

/**
 * GA4's item identity. GA4 is not subject to the Meta classification posture
 * described in `lib/meta-capi.ts`, so a readable product name is fine here and
 * is what makes the ecommerce reports legible. Meta receives none of this.
 */
export const GA4_ITEM_ID = "sandesh-eon-strategy-call";
