import Link from "next/link";

import { LEGAL } from "@/app/_legal/legal";

/**
 * One footer for every page that has one: the policy pages and the checkout.
 *
 * It is scoped to its OWN root class, not to a page wrapper. It used to be
 * styled as `.eon-policy .footer`, which meant the identical markup rendered
 * completely unstyled on the checkout, where the wrapper is `.eon-checkout`. A
 * shared component cannot depend on where it is mounted, or it is not shared.
 *
 * Carries the registered name, the full postal address and a working phone plus
 * email, because Razorpay's merchant review looks for all four on the SITE
 * rather than inside one policy page.
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
