"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackViewItem } from "@/lib/track";

/**
 * Landing-page tracking. Renders nothing.
 *
 * Mounted in `app/layout.tsx` rather than inside `app/page.tsx`, and it decides
 * for itself whether the current route is the landing page. The landing page
 * and its sections belong to SHAPE; the tracking rail is LAUNCH's. Putting the
 * tracker in the layout keeps that boundary intact and means a future landing
 * edit cannot silently delete the funnel's first event.
 *
 * It fires on the LANDING ROUTE ONLY. The checkout fires its own arrival event
 * from its own mount, because a visitor who opens /checkout from an email, a
 * retargeting ad or a bookmark never touches the landing page and would
 * otherwise be invisible to Meta until the pay tap. The legal pages fire
 * nothing: a reader of the refund policy has not seen the offer.
 *
 * AddToCart deliberately does NOT fire from here on a CTA click. The landing
 * page carries seven CTAs, so a click listener counts a reader who taps two of
 * them twice, which inflates AddToCart volume and deflates the
 * cost-per-AddToCart the ads are judged on. A click is also not an arrival.
 * Do not re-add it: the two together double-count every ordinary buyer.
 */
const LANDING_ROUTES = new Set(["/"]);

export default function FunnelTracker() {
  const pathname = usePathname();
  /* Guards against StrictMode's double effect and against a client-side
     navigation back to "/" re-firing within the same render pass. The
     per-session dedup inside once() is the real backstop; this is the cheap
     one that never touches storage. */
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (!pathname || !LANDING_ROUTES.has(pathname)) return;
    fired.current = true;
    /* ViewContent: the offer has been seen. Once per session, not per browser
       lifetime, so a returning visitor still feeds the retargeting audience. */
    trackViewItem();
  }, [pathname]);

  return null;
}
