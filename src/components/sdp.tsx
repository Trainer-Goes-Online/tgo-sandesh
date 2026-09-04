/**
 * SDP shared primitives: Sandesh Soans / Extreme or Nothing Protocol.
 *
 * The SDP VSL component system (design-system.skin.sdp-vsl.md), re-themed to
 * the theme block in `app/globals.css`. Nothing in this file carries a colour or a font:
 * every visual decision lives in the stylesheet's token block, so a re-brand is
 * a Part-1 edit and never a component edit.
 *
 * Server components throughout. The only client parts of the page are
 * `OfferTimer` (localStorage deadline) and `VSLFrame` (poster -> player swap).
 */
import type { CSSProperties, ReactNode } from "react";
import { OfferTimer } from "./OfferTimer";

/* ===================================================================
   Funnel constants. The checkout route is LAUNCH's to build; the CTA
   only needs to point at it.
   =================================================================== */
export const CHECKOUT_URL = "/checkout";

/* The countdown window (5 hours, per the copy) is owned by OfferTimer.tsx, 
   one source of truth, and importing it here would make the two files cyclic. */

/* ===================================================================
   Glyphs: line icons, never emoji. The source copy prints the CTA
   badges with emoji (star / fire / 100); the skin bans emoji in chrome,
   so they render as the icons below with the wording left untouched.
   =================================================================== */
type IconProps = { size?: number };

export function ArrowGlyph({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckGlyph({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12.5l5.2 5.2L20 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarGlyph({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z" />
    </svg>
  );
}

export function ShieldGlyph({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function FlameGlyph({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2.5s5 4.1 5 8.6a5 5 0 0 1-10 0c0-1.7.8-3.1 1.7-4.2.3 1.3 1 2.1 1.9 2.1 1.2 0 1.7-1.1 1.4-2.7-.2-1.3-.6-2.6-.0-3.8z" />
      <path d="M12 21.5a5 5 0 0 0 5-5" opacity=".45" />
    </svg>
  );
}

export function LeafGlyph({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 4c0 9-5.4 14-12 14a6 6 0 0 1 0-12c4 0 7-.7 12-2z" />
      <path d="M4 20c3-6 7-9 12-11" />
    </svg>
  );
}

export function PlayGlyph({ size = 26 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function ChevronDownGlyph({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

export function PlusGlyph({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ===================================================================
   Section shell + masthead
   =================================================================== */
type Band = "light" | "light-alt" | "dark" | "dark-alt";

/** A page section on one of the four bands. The light / light-alt / dark
 *  alternation IS the skin: dark is reserved for authority + risk beats. */
export function Section({
  id,
  band = "light",
  className = "",
  children,
}: {
  id?: string;
  band?: Band;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`sdp-section sdp-${band} ${className}`.trim()}>
      <div className="sdp-wrap">{children}</div>
    </section>
  );
}

/** Section masthead: dash eyebrow -> display H2 (accent word via <em>) -> deck.
 *  Eyebrows are ALWAYS uppercase; the CSS enforces it, the copy is passed as-is. */
export function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <>
      {eyebrow && <div className="sdp-eyebrow center">{eyebrow}</div>}
      <h2 className="sdp-h2">{title}</h2>
      {sub && <p className="sdp-sub">{sub}</p>}
    </>
  );
}

/** The hero's audience gate: bordered pill + glowing dot (post-Kunal lock). */
export function GatePill({ children }: { children: ReactNode }) {
  return (
    <span className="sdp-eyebrow-pill">
      <span className="glowdot" aria-hidden />
      {children}
    </span>
  );
}

/* ===================================================================
   Chips
   =================================================================== */
export function MarkerChip({ children }: { children: ReactNode }) {
  return (
    <span className="sdp-marker-chip">
      <span className="sdp-marker-dot" aria-hidden />
      {children}
    </span>
  );
}

export function MarkerChips({ items, label }: { items: string[]; label?: string }) {
  return (
    <div className="sdp-hero-markers" aria-label={label}>
      {items.map((c) => (
        <MarkerChip key={c}>{c}</MarkerChip>
      ))}
    </div>
  );
}

/* ===================================================================
   THE CTA LOCKUP: button welded to its risk / timer / note stack.
   Reused verbatim after every proof beat; the pieces never appear apart.
   Order is fixed and matches the source copy: button -> three reassurance
   badges -> the 5-hour offer countdown.
   =================================================================== */
export const CTA_LABEL =
  "Click Here To Get Your Personalised Diagnosis & Transformation Roadmap";

export const CTA_BADGES: { icon: "star" | "flame" | "leaf"; label: string }[] = [
  { icon: "star", label: "100% Money-Back Guarantee" },
  { icon: "flame", label: "1000+ Success Stories" },
  { icon: "leaf", label: "100% Natural Transformation Approach" },
];

function BadgeIcon({ name }: { name: "star" | "flame" | "leaf" }) {
  if (name === "star") return <StarGlyph size={16} />;
  if (name === "flame") return <FlameGlyph />;
  return <LeafGlyph />;
}

export function RiskStrip() {
  return (
    <div className="sdp-risk-strip">
      {CTA_BADGES.map((b, i) => (
        <span className="sdp-risk-badge" key={b.label}>
          <span
            className={`sdp-risk-icon ${
              i === 0 ? "sdp-risk-icon-gold" : i === 1 ? "sdp-risk-icon-blue" : "sdp-risk-icon-green"
            }`}
          >
            <BadgeIcon name={b.icon} />
          </span>
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function PrimaryCTA({ sub }: { sub?: ReactNode }) {
  return (
    <a className="sdp-cta" href={CHECKOUT_URL}>
      <span className="sdp-cta-top">
        <span className="cta-label">{CTA_LABEL}</span>
        <span className="arrow" aria-hidden>
          <ArrowGlyph />
        </span>
      </span>
      {sub && <span className="cta-sub">{sub}</span>}
    </a>
  );
}

export function CtaLockup({ note, ctaSub }: { note?: ReactNode; ctaSub?: ReactNode }) {
  return (
    <div className="sdp-lockup">
      <PrimaryCTA sub={ctaSub} />
      <RiskStrip />
      <OfferTimer />
      {note && <span className="sdp-cta-note">{note}</span>}
    </div>
  );
}

/* ===================================================================
   MEDIA PLACEHOLDER
   Sized at the REAL asset's aspect ratio so that dropping the photograph
   in later reflows nothing, and labelled with the ask so whoever shoots
   it knows what belongs there without opening the file.
   =================================================================== */
export function MediaPlaceholder({
  ratio,
  label,
  tag = "Photo needed",
  round = false,
  compact = false,
  className = "",
  style,
}: {
  /** e.g. "16/9", "4/5", "1/1": the real image's ratio, not a guess. */
  ratio: string;
  /** What belongs here, in plain words. */
  label: string;
  tag?: string;
  round?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`sdp-ph${round ? " sdp-ph-round" : ""}${compact ? " is-compact" : ""} ${className}`.trim()}
      style={{ ["--ph-ratio"]: ratio, ...style } as CSSProperties}
      role="img"
      aria-label={`${label} (image pending)`}
      title={`${label}: ${ratio}`}
    >
      <div className="sdp-ph-inner">
        <div className="sdp-ph-tag">{tag}</div>
        <div className="sdp-ph-label">{label}</div>
        <div className="sdp-ph-ratio">{ratio}</div>
      </div>
    </div>
  );
}


/** Reveal delay helper: `<div data-sdp-reveal style={revealDelay(".12s")}>` */
export function revealDelay(d: string): CSSProperties {
  return { ["--d"]: d } as CSSProperties;
}
