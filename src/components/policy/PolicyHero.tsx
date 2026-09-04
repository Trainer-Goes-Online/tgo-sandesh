import type { ReactNode } from "react";

/** The policy masthead: pill eyebrow, display title with one accent word, deck,
 *  and a single meta chip. Same anatomy as the live SDP funnel. */
export default function PolicyHero({
  eyebrow,
  title,
  sub,
  metaLabel,
  metaValue,
}: {
  eyebrow: string;
  title: ReactNode;
  sub: ReactNode;
  metaLabel: string;
  metaValue: string;
}) {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="hero-sub">{sub}</p>
        <div className="hero-meta">
          <span className="pip" aria-hidden />
          {metaLabel}: <b>{metaValue}</b>
        </div>
      </div>
    </section>
  );
}
