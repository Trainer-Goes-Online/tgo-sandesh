import Link from "next/link";

import { LEGAL } from "@/app/_legal/legal";

/**
 * One footer for every page that has one: the policy pages, booking and
 * thank-you. Scoped to its OWN root class, not to a page wrapper, so it renders
 * the same wherever it is mounted.
 *
 * Carries the registered name, the full postal address and a working phone plus
 * email on the SITE rather than inside one policy page.
 */
export default function SiteFooter() {
  return (
    <footer className="eon-foot">
      <div className="eon-foot-wrap">
        <div className="eon-foot-brand">{LEGAL.brand}</div>
        <p>
          © 2026 {LEGAL.entity} All rights reserved.
          <br />
          {LEGAL.address}
          <br />
          <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>
          {" · "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
        <div className="eon-foot-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
          <Link href="/refund-policy">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
