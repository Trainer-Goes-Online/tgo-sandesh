import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";

import Analytics from "@/components/Analytics";
import FunnelTracker from "@/components/FunnelTracker";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

/* DISPLAY: condensed caps, the skin's --fh role. Oswald replaces Anton, which
   read as a gym poster next to copper. Two weights only: 600 sets the headings,
   700 is there for the few places that need to push harder. Anything more and
   the display voice stops being one voice. */
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

/* BODY: neutral grotesque, the skin's --fb role. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* The live origin.

   Without a metadataBase Next resolves every share URL and every relative OG
   asset against localhost, so a link pasted into WhatsApp previews as a dead
   local address.

   Deliberately defensive, because metadataBase is evaluated at BUILD time on
   every route including the generated /_not-found, so a bad value here does not
   degrade a page, it fails the deploy. `??` does NOT catch an empty string, and
   a host that defines the variable with a blank value (Vercel does exactly this
   when a key is added without one) gives new URL('') and ERR_INVALID_URL.

   Keep identical to `fallbackEventSourceUrl` in src/lib/checkout-config.ts,
   which is the value Meta receives as event_source_url. */
const FALLBACK_ORIGIN = "https://transformmebro.com";

function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (!raw) return FALLBACK_ORIGIN;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

const SITE_URL = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    "Sandesh Soans | Drop 8-10% Body Fat & Build Visible Abs In 90-120 Days",
  description:
    "The Extreme or Nothing Protocol: a 90-120 day natural physique transformation for men 28-40. 1000+ success stories across 7 countries, 4x natural bodybuilding pro coach, 100% money-back guarantee.",
  // Pre-launch: keep out of search until assets and the VSL land.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* The font variables go on <html>, NOT on <body>.

       --fh and --fb are declared on :root, which IS <html>, and a custom
       property's var() references are resolved on the element that declares it.
       With --font-oswald sitting on <body>, a child, the reference at :root was
       invalid, --fh computed to the guaranteed-invalid value, and every
       font-family:var(--fh) on the site silently fell back to the browser
       default. Declaring them on the same element as the tokens that read them
       is the fix. */
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body>
        {/* Meta pixel base code + PageView. Also the site's attribution
            capture, which runs above the pixel-id guard inside the component so
            it cannot go dark when the pixel id is unset. */}
        <MetaPixel />
        {/* GA4 + Clarity, from env. Renders nothing until the ids are set.
            Without this every browser-side GA4 call is a silent no-op and the
            webhook reports purchases with no funnel above them. */}
        <Analytics />
        {/* ViewContent, on the landing route only. Mounted here rather than in
            page.tsx so the landing page stays SHAPE's file and the funnel's
            first event cannot be deleted by a layout edit to it. */}
        <FunnelTracker />
        {children}
      </body>
    </html>
  );
}
