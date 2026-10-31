"use client";

/* The shared shape and the storage key live in the SERVER-SAFE sibling, and
   this file imports from it rather than the other way round. A `'use client'`
   module cannot be called from middleware or an API route: the import
   succeeds, the call throws. Keep the arrow pointing this way. */
import {
  CAMPAIGN_KEYS,
  CAP,
  EMPTY,
  KEY,
  capFor,
  cut,
  parseAttributionFromUrl,
  type Attribution,
} from "@/lib/attribution-edge";

export type { Attribution };

/**
 * First-touch attribution, THE BROWSER HALF and the BACKUP: `middleware.ts`
 * writes the same values into a cookie at the edge, before any JavaScript
 * runs, because an in-app browser can navigate away before hydration and is
 * also the first thing to restrict localStorage.
 *
 * Both halves exist because the checkout url has no query string: the buyer
 * navigated there by clicking a link, so the answer to "which ad produced this
 * sale" evaporates one click after arrival unless it is stamped on arrival.
 *
 * Overwrite rule: a visit carrying a utm_* or Meta ad param, or an fbclid, is a new ad click
 * and replaces what is stored. A visit with neither leaves the stored campaign
 * alone rather than blanking it, which is what makes paid sales look organic.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const live = parseAttributionFromUrl(window.location.search);
    const fbclid = live.fbclid ?? "";
    const hasCampaign = CAMPAIGN_KEYS.some((k) => live[k]);

    /* Nothing to record and something already stored: leave it. */
    const stored = window.localStorage.getItem(KEY);
    if (stored && !hasCampaign && !fbclid) return;

    const next: Attribution = {
      ...EMPTY,
      fbclid: cut(fbclid, CAP.fbclid),
      /* An internal referrer is not an acquisition source. Recording it would
         report every sale as coming from our own landing page. */
      referrer: isExternal(document.referrer)
        ? cut(document.referrer, CAP.referrer)
        : "",
      landingUrl: cut(window.location.href, CAP.landingUrl),
    };
    for (const k of CAMPAIGN_KEYS) next[k] = cut(live[k], capFor(k));
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage disabled: attribution is nice to have, never
       worth throwing into a page load */
  }
}

function isExternal(ref: string): boolean {
  if (!ref) return false;
  try {
    return new URL(ref).host !== window.location.host;
  } catch {
    return false;
  }
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    return EMPTY;
  }
}
