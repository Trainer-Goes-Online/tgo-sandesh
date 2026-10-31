"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackAddToCart, trackViewItem } from "@/lib/track";

/**
 * Landing-page tracking. Renders nothing.
 *
 * Mounted in `app/layout.tsx` rather than inside `app/page.tsx`, and it decides
 * for itself whether the current route is the landing page. The landing page
 * and its sections belong to SHAPE; the tracking rail is LAUNCH's. Putting the
 * tracker in the layout keeps that boundary intact and means a future landing
 * edit cannot silently delete the funnel's events.
 *
 * It fires on the LANDING ROUTE ONLY. The legal pages fire nothing: a reader of
 * the refund policy has not seen the offer.
 *
 *   ViewContent  on arrival, once per session
 *   AddToCart    on every click of a `data-cta` link (all go to /checkout)
 */
const LANDING_ROUTES = new Set(["/"]);

/* Long enough for the pixel's own request to leave before the page unloads
   (the CAPI copy is keepalive and needs no wait), short enough not to feel. */
const NAV_DELAY_MS = 180;

export default function FunnelTracker() {
  const pathname = usePathname();
  /* Guards against StrictMode's double effect and against a client-side
     navigation back to "/" re-firing within the same render pass. The
     per-session dedup inside once() is the real backstop; this is the cheap
     one that never touches storage. */
  const fired = useRef(false);
  const onLanding = Boolean(pathname && LANDING_ROUTES.has(pathname));

  useEffect(() => {
    if (fired.current || !onLanding) return;
    fired.current = true;
    /* ViewContent: the offer has been seen. Once per session, not per browser
       lifetime, so a returning visitor still feeds the retargeting audience. */
    trackViewItem();
  }, [onLanding]);

  useEffect(() => {
    if (!onLanding) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-cta]");
      if (!a) return;
      trackAddToCart();
      /* A modified click opens a new tab and this page stays, so the pixel
         has all the time it needs. */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const href = a.href;
      window.setTimeout(() => window.location.assign(href), NAV_DELAY_MS);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [onLanding]);

  return null;
}
