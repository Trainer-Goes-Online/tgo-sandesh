import type { ReactNode } from "react";

import { LEGAL } from "@/app/_legal/legal";

/** The charcoal close on every policy page: one icon, a heading, a line, and
 *  the way back. Mirrors the live SDP funnel's contact block. */
export default function PolicyContactCTA({
  heading,
  body,
}: {
  heading: ReactNode;
  body: ReactNode;
}) {
  return (
    <section className="contact">
      <div className="wrap">
        <div className="contact-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16v14H4z" />
            <path d="m4 6 8 6 8-6" />
          </svg>
        </div>
        <h3>{heading}</h3>
        <p>{body}</p>
        <p className="contact-lines">
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          {" · "}
          <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>
        </p>
        <a href="/" className="home-link">
          ← Back to homepage
        </a>
      </div>
    </section>
  );
}
