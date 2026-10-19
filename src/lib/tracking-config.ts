/**
 * SERVER-ONLY. Every constant the tracking route needs, in one place.
 *
 * Do not import this into a client component. It reads META_CAPI_ACCESS_TOKEN,
 * and while Next strips non-public env vars from the browser bundle, a module
 * that mentions them has no business in it. The constants a client genuinely
 * needs live in `lib/funnel.ts`.
 */
export const TRACKING_CONFIG = {
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
} as const;

/** True only when a real CAPI call can be made. Routes check this and skip
 *  quietly rather than posting to Meta with an empty pixel id. */
export const capiReady = () =>
  Boolean(TRACKING_CONFIG.meta.pixelId && TRACKING_CONFIG.meta.accessToken);
