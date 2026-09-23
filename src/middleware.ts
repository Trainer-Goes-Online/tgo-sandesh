import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ATTR_COOKIE,
  ATTR_TTL_SECONDS,
  mergeAttribution,
  parseAttributionFromUrl,
  readAttrCookie,
} from "@/lib/attribution-edge";

/**
 * EDGE ATTRIBUTION CAPTURE.
 *
 * The browser capture in lib/attribution.ts runs in a React effect and writes
 * to localStorage, which loses hardest for the traffic this funnel buys: in
 * the Instagram and Facebook in-app browsers a visitor can tap the CTA before
 * hydration runs, and those browsers restrict that storage anyway. Reading the
 * query string here, on the first request, removes the race.
 *
 * Both writers share one cookie and one shape, so they agree rather than
 * overwrite each other.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const live = parseAttributionFromUrl(req.nextUrl.search);
    const stored = readAttrCookie(req.cookies.get(ATTR_COOKIE)?.value);

    const { attr, changed } = mergeAttribution(stored, {
      live,
      landingUrl: req.nextUrl.href,
      referrer: req.headers.get("referer") ?? "",
    });

    if (changed) {
      /* RAW JSON, not encoded. Next's cookie API encodes it once on the way
         out; encoding it here too would double-encode and the browser-side
         reader would never parse it back. */
      res.cookies.set(ATTR_COOKIE, JSON.stringify(attr), {
        path: "/",
        maxAge: ATTR_TTL_SECONDS,
        sameSite: "lax",
        /* Readable by the browser on purpose: it carries campaign context,
           never anything secret. */
        httpOnly: false,
        secure: req.nextUrl.protocol === "https:",
      });
    }
  } catch {
    /* Attribution is best-effort and must never break a page render: a visitor
       who cannot see the page is worse than a sale with blank utm columns. */
  }

  return res;
}

/* Real page navigations only. API routes are skipped because the checkout POST
   must not be treated as a new touch, and Next internals and static files are
   skipped because they are not visits. */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
