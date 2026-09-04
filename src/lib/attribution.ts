"use client";

/**
 * First-touch attribution, captured once and remembered.
 *
 * The problem this solves: reading UTMs off the CURRENT url returns nothing on
 * /checkout, because the buyer navigated there from the landing page by
 * clicking a link. So every UTM, the fbclid and the referrer (the entire
 * answer to "which ad produced this sale") evaporates one click after arrival,
 * and the order is written with blank campaign fields. Every paid sale then
 * reports as organic.
 *
 * So the campaign context is stamped into localStorage on FIRST landing, on
 * whichever page that happens to be, and read back at checkout.
 *
 * Overwrite rule: a visit carrying a utm_source or an fbclid is a new ad click
 * and replaces what is stored. Last paid click wins, which is what the ad
 * account is judged on. A visit with neither (a direct return, a bookmark, an
 * organic search) leaves the stored campaign alone rather than blanking it.
 */

const KEY = "eon_attr";

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
};

const EMPTY: Attribution = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  fbclid: "",
  referrer: "",
  landingUrl: "",
};

/* Capped at the point of CAPTURE, not at the point of sending. These values
   ride to the webhook inside the Razorpay order notes, which Razorpay caps at
   256 characters per entry, and a landing url with five utm params and an
   fbclid on it routinely runs past 400. Trimming here keeps the cap a known
   quantity instead of a silent truncation later. */
const CAP = {
  utm: 100,
  fbclid: 200,
  referrer: 200,
  landingUrl: 300,
} as const;

const cut = (v: string | null | undefined, max: number) => (v ?? "").slice(0, max);

export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(window.location.search);
    const fbclid = q.get("fbclid") ?? "";
    const utmSource = q.get("utm_source") ?? "";

    /* Nothing to record and something already stored: leave it. */
    const stored = window.localStorage.getItem(KEY);
    if (stored && !utmSource && !fbclid) return;

    const next: Attribution = {
      utmSource: cut(utmSource, CAP.utm),
      utmMedium: cut(q.get("utm_medium"), CAP.utm),
      utmCampaign: cut(q.get("utm_campaign"), CAP.utm),
      utmContent: cut(q.get("utm_content"), CAP.utm),
      utmTerm: cut(q.get("utm_term"), CAP.utm),
      fbclid: cut(fbclid, CAP.fbclid),
      /* An internal referrer is not an acquisition source. Recording it would
         report every sale as coming from our own landing page. */
      referrer: isExternal(document.referrer)
        ? cut(document.referrer, CAP.referrer)
        : "",
      landingUrl: cut(window.location.href, CAP.landingUrl),
    };
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
