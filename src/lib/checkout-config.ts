import { LEGAL, PRICE } from "@/app/_legal/legal";

/**
 * SERVER-ONLY. Every constant the payment and tracking routes need, in one
 * place.
 *
 * Do not import this into a client component. It reads RAZORPAY_KEY_SECRET and
 * META_CAPI_ACCESS_TOKEN, and while Next strips non-public env vars from the
 * browser bundle, a module that mentions them has no business in it. The
 * constants a client genuinely needs live in `lib/funnel.ts`.
 *
 * The amount comes from `app/_legal/legal.ts`, which is this project's single
 * source for the price. The checkout renders `PRICE.amount`, Razorpay is
 * charged `PRICE.amount * 100` paise, and Meta and GA4 receive `PRICE.amount`
 * as `value`. One number, so the charge and the label cannot disagree.
 */
export const CHECKOUT_CONFIG = {
  amountRupees: PRICE.amount,
  amountPaise: PRICE.amount * 100,
  currency: "INR",
  /* GA4 only. This string is never sent to Meta: see the classification note
     at the top of lib/meta-capi.ts. */
  itemName: LEGAL.product,

  /* ⚠️ PLACEHOLDER FALLBACK. The launch domain is not in the source, so this
     is still example.com. It is only reached when NEXT_PUBLIC_SITE_URL is
     unset or blank, but when it IS reached the value is sent to Meta as
     event_source_url, so an unset env var would quietly attribute live events
     to a domain nobody owns. Replace this literal the moment the domain is
     fixed, and set NEXT_PUBLIC_SITE_URL regardless.

     `||`, not `??`. A host that defines the key with a blank value yields an
     empty string, which `??` passes straight through, and an empty
     event_source_url is silently worthless to Meta. */
  fallbackEventSourceUrl:
    (process.env.NEXT_PUBLIC_SITE_URL || "").trim() || "https://example.com",

  meta: {
    pixelId: process.env.META_PIXEL_ID ?? "",
    accessToken: process.env.META_CAPI_ACCESS_TOKEN ?? "",
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE ?? "",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  },
} as const;

/** True only when a real CAPI call can be made. Routes check this and skip
 *  quietly rather than posting to Meta with an empty pixel id. */
export const capiReady = () =>
  Boolean(CHECKOUT_CONFIG.meta.pixelId && CHECKOUT_CONFIG.meta.accessToken);

/** True only when Razorpay can actually be called. */
export const razorpayReady = () =>
  Boolean(CHECKOUT_CONFIG.razorpay.keyId && CHECKOUT_CONFIG.razorpay.keySecret);

/** The Basic auth header for Razorpay's REST API, built once. */
export const razorpayAuthHeader = () =>
  `Basic ${Buffer.from(
    `${CHECKOUT_CONFIG.razorpay.keyId}:${CHECKOUT_CONFIG.razorpay.keySecret}`,
  ).toString("base64")}`;

/**
 * Whether this deployment is transacting in test mode, DERIVED rather than
 * declared.
 *
 * Razorpay stamps its own environment into the key id (`rzp_test_` versus
 * `rzp_live_`) so this cannot drift the way a separate IS_TEST env var would
 * when someone swaps the keys and forgets the flag. A Meta test event code is
 * also treated as test, because events sent with one do not count toward
 * optimisation and the sale they describe is not real.
 */
export const isTestMode = () =>
  CHECKOUT_CONFIG.razorpay.keyId.startsWith("rzp_test_") ||
  Boolean(CHECKOUT_CONFIG.meta.testEventCode);
