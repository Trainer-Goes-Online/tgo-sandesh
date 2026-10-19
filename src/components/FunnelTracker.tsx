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
 * It fires on the LANDING ROUTE ONLY. The legal pages fire nothing: a reader of
 * the refund policy has not seen the offer.
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
