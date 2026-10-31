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
 * The amount comes from `PRICE` in `app/_legal/legal.ts`, which reads
 * NEXT_PUBLIC_CHECKOUT_PRICE_INR. The checkout renders `PRICE.amount`,
 * Razorpay is charged `PRICE.amount * 100` paise, and Meta and GA4 receive
 * `PRICE.amount` as `value`. One number, so the charge and the label cannot
 * disagree.
 */
export const TRACKING_CONFIG = {
  amountRupees: PRICE.amount,
  amountPaise: PRICE.amount * 100,
  currency: PRICE.currency,
  /* GA4 and Pabbly only. This string is never sent to Meta: see the
     classification note at the top of lib/meta-capi.ts. */
  itemName: LEGAL.product,

  /* ⚠️ PLACEHOLDER FALLBACK, only reached when NEXT_PUBLIC_SITE_URL is unset
     or blank, but when it IS reached this value is sent to Meta as
     event_source_url and would attribute live events to a domain nobody owns.

     `||`, not `??`: a host that defines the key with a blank value yields an
     empty string, which `??` passes straight through. */
  fallbackEventSourceUrl:
    (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "") ||
    "https://transformmebro.com",

  meta: {
    pixelId: process.env.META_PIXEL_ID ?? "",
    accessToken: process.env.META_CAPI_ACCESS_TOKEN ?? "",
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE ?? "",
  },
  razorpay: {
    keyId: (process.env.RAZORPAY_KEY_ID ?? "").trim(),
    keySecret: (process.env.RAZORPAY_KEY_SECRET ?? "").trim(),
    webhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET ?? "").trim(),
  },
} as const;

/** True only when a real CAPI call can be made. Routes check this and skip
 *  quietly rather than posting to Meta with an empty pixel id. */
export const capiReady = () =>
  Boolean(TRACKING_CONFIG.meta.pixelId && TRACKING_CONFIG.meta.accessToken);

/** True only when Razorpay can actually be called. */
export const razorpayReady = () =>
  Boolean(TRACKING_CONFIG.razorpay.keyId && TRACKING_CONFIG.razorpay.keySecret);

/** The Basic auth header for Razorpay's REST API. */
export const razorpayAuthHeader = () =>
  `Basic ${Buffer.from(
    `${TRACKING_CONFIG.razorpay.keyId}:${TRACKING_CONFIG.razorpay.keySecret}`,
  ).toString("base64")}`;

/**
 * Whether this deployment is transacting in test mode, DERIVED rather than
 * declared: Razorpay stamps its environment into the key id (`rzp_test_`
 * versus `rzp_live_`), so this cannot drift the way a separate flag would. A
 * Meta test event code also counts, because events sent with one do not count
 * toward optimisation.
 */
export const isTestMode = () =>
  TRACKING_CONFIG.razorpay.keyId.startsWith("rzp_test_") ||
  Boolean(TRACKING_CONFIG.meta.testEventCode);
