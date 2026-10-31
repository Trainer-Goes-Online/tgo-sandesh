/**
 * Attribution, the SERVER-SAFE half, used by `middleware.ts` and the API
 * routes.
 *
 * THIS FILE HAS NO `'use client'` DIRECTIVE AND MUST NOT GAIN ONE. Its sibling
 * `lib/attribution.ts` is the browser half and IS marked `'use client'`, so a
 * route importing it gets a client reference and throws when it calls one. The
 * dependency runs one way: the browser file imports this one, never back.
 */

export const KEY = "eon_attr";

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  /* Meta's ad identity, from the dynamic URL parameters set on the ad (the
     template is in `.env.example`). Ids are what join a sale back to the ad
     in Ads Manager; names are for the sheet. */
  campaignId: string;
  adsetId: string;
  adId: string;
  campaignName: string;
  adsetName: string;
  adName: string;
  placement: string;
  siteSourceName: string;
  referrer: string;
  landingUrl: string;
};

export const EMPTY: Attribution = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  fbclid: "",
  campaignId: "",
  adsetId: "",
  adId: "",
  campaignName: "",
  adsetName: "",
  adName: "",
  placement: "",
  siteSourceName: "",
  referrer: "",
  landingUrl: "",
};

/* Capped at CAPTURE, not at send: the cookie stays small, and these values
   ride to the webhook inside Razorpay notes, which are capped at 256
   characters each. */
export const CAP = {
  utm: 100,
  adId: 32,
  fbclid: 200,
  referrer: 200,
  landingUrl: 300,
} as const;

export const cut = (v: string | null | undefined, max: number) =>
  (v ?? "").slice(0, max);

export const ATTR_COOKIE = KEY;
export const ATTR_TTL_SECONDS = 30 * 24 * 60 * 60;

const URL_TO_KEY: Record<string, keyof Attribution> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
  fbclid: "fbclid",
  campaign_id: "campaignId",
  adset_id: "adsetId",
  ad_id: "adId",
  campaign_name: "campaignName",
  adset_name: "adsetName",
  ad_name: "adName",
  placement: "placement",
  site_source_name: "siteSourceName",
};

/** The CAMPAIGN half of an Attribution: every key that is last-touch and is
 *  replaced, together, by a new ad click. */
export const CAMPAIGN_KEYS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
  "campaignId",
  "adsetId",
  "adId",
  "campaignName",
  "adsetName",
  "adName",
  "placement",
  "siteSourceName",
] as const satisfies readonly (keyof Attribution)[];

const ID_KEYS = new Set<keyof Attribution>(["campaignId", "adsetId", "adId"]);
export const capFor = (key: keyof Attribution) => (ID_KEYS.has(key) ? CAP.adId : CAP.utm);

const filled = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";

/** The campaign values carried on THIS request's query string. */
export function parseAttributionFromUrl(search: string): Partial<Attribution> {
  const out: Partial<Attribution> = {};
  if (!search) return out;
  try {
    const sp = new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search,
    );
    for (const [param, key] of Object.entries(URL_TO_KEY)) {
      const v = sp.get(param);
      if (filled(v)) out[key] = v;
    }
  } catch {
    /* malformed query string: best effort, never throw at the edge */
  }
  return out;
}

/** Tolerant of both wire forms: the value Next has already URL-decoded once,
 *  and a still-encoded one. Raw is tried FIRST, because decoding first would
 *  corrupt %-sequences that legitimately live inside a stored landing url. */
export function readAttrCookie(raw: string | undefined): Partial<Attribution> {
  if (!filled(raw)) return {};
  const attempts = [raw];
  try {
    attempts.push(decodeURIComponent(raw));
  } catch {
    /* malformed %-escape: skip that form */
  }
  for (const s of attempts) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Partial<Attribution>;
      }
    } catch {
      /* try the next form */
    }
  }
  return {};
}

/**
 * Merge a new touch into what is already stored. The two halves age
 * differently, and reversing them is how a funnel reports every sale as coming
 * from its own landing page:
 *   CONTEXT (landingUrl, referrer) is FIRST-touch. Where the session began.
 *   CAMPAIGN (utm*, Meta ad params, fbclid) is LAST-touch. The click that
 *   actually sent them.
 */
export function mergeAttribution(
  stored: Partial<Attribution>,
  opts: { live: Partial<Attribution>; landingUrl: string; referrer: string },
): { attr: Partial<Attribution>; changed: boolean } {
  const attr: Partial<Attribution> = { ...stored };
  let changed = false;

  if (!filled(attr.landingUrl) && filled(opts.landingUrl)) {
    attr.landingUrl = cut(opts.landingUrl, CAP.landingUrl);
    attr.referrer = filled(opts.referrer)
      ? cut(opts.referrer, CAP.referrer)
      : "";
    changed = true;
  }

  const live = opts.live;
  const hasCampaign =
    CAMPAIGN_KEYS.some((k) => filled(live[k])) || filled(live.fbclid);

  if (hasCampaign) {
    for (const k of CAMPAIGN_KEYS) attr[k] = cut(live[k] ?? "", capFor(k));
    if (filled(live.fbclid)) attr.fbclid = cut(live.fbclid, CAP.fbclid);
    changed = true;
  }

  return { attr, changed };
}

/**
 * Serialise a small object into ONE Razorpay note value, guaranteed valid JSON
 * and under the 256-character limit.
 *
 * It shortens the LONGEST VALUE, repeatedly, and never cuts the finished JSON:
 * slicing a serialised object mid-string produces something no parser can
 * read, so one long value would take every field beside it down too.
 */
export function packJsonNote(obj: Record<string, string>, max = 256): string {
  const w: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    w[k] = typeof v === "string" ? v : String(v ?? "");
  }

  let json = JSON.stringify(w);
  let guard = 0;
  while (json.length > max && guard < 200) {
    guard += 1;
    let key: string | null = null;
    let len = 0;
    for (const [k, v] of Object.entries(w)) {
      if (v.length > len) {
        len = v.length;
        key = k;
      }
    }
    if (!key || len === 0) break;
    const trim = Math.max(1, Math.min(len, json.length - max));
    w[key] = w[key].slice(0, len - trim);
    json = JSON.stringify(w);
  }
  /* Still over after shortening everything: an empty object is readable, a
     truncated one is not. */
  return json.length > max ? "{}" : json;
}
