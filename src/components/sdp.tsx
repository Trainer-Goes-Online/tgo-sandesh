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

/* The one brand mark in the set: a WhatsApp CTA reads as WhatsApp only with
   its own glyph, so this is the platform's logo, not a line icon. */
export function WhatsAppGlyph({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.21-3.57.94.95-3.48-.22-.36a9.42 9.42 0 0 1-1.44-5.03c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.3l5.7-1.5a11.33 11.33 0 0 0 5.77 1.47h.01c6.26 0 11.36-5.1 11.37-11.36a11.3 11.3 0 0 0-3.34-8.04z" />
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
  { icon: "star", label: "100% Money-Back Guarantee On The Programme" },
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
