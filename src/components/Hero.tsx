import type { ReactNode } from "react";
import { VSLFrame } from "./VSLFrame";
import {
  ChevronDownGlyph,
  CtaLockup,
  GatePill,
  MarkerChips,
  StarGlyph,
  revealDelay,
} from "./sdp";

/**
 * BEAT 1: HERO + VSL. The page's heaviest composite and its focal-media beat.
 *
 * Every string here is the source md's own, in the source md's order:
 *   gate pill -> five-line H1 -> protocol line -> the "1000+ men across
 *   7 countries ... achieving:" lead -> six outcome chips -> watch cue ->
 *   VSL -> CTA lockup (button, three badges, 5-hour countdown) -> stat band.
 *
 * Two renderings differ from the md's characters, never its words: the emoji
 * (⬇️, ★) are drawn glyphs, because the skin bans emoji in chrome and a glyph
 * inherits the type colour; and the headline's line breaks are released below
 * 640px where a forced break orphans two-word lines.
 *
 * Server component. The countdown inside the lockup and the video swap inside
 * VSLFrame are the only client pieces.
 */

const OUTCOMES = [
  "Single-Digit Body Fat",
  "Visible 6-Pack Abs",
  "3D Muscle Definition",
  "Athletic Muscle Mass",
  "Top 1% Mindset",
  "V-Taper Physique",
];

const STATS: { num: ReactNode; label: string }[] = [
  { num: "1000+", label: "Success Stories" },
  { num: "10+ Years", label: "Coaching Experience" },
  {
    num: (
      <>
        5.0{" "}
        <StarGlyph size={20} />
      </>
    ),
    label: "Client Rating",
  },
  { num: "₹97", label: "To Start" },
];

export function Hero() {
  return (
    <section id="top" className="sdp-hero">
      <div className="sdp-wrap sdp-hero-inner">
        <GatePill>
          FOR MEN 28–40 WHO ARE TIRED OF LOOKING AVERAGE DESPITE YEARS OF TRAINING
        </GatePill>

        <h1 className="sdp-h1" data-sdp-reveal style={revealDelay(".06s")}>
          <span className="sdp-h1-l1 is-long">
            Drop 8–10% Body Fat
            <br className="sdp-br-lg" />{" "}
            Build Visible Abs &amp;
            <br className="sdp-br-lg" />{" "}
            Achieve A Physique People
            <br className="sdp-br-lg" />{" "}
            Can’t Believe Is ‘Natural’
          </span>
          <span className="sdp-h1-l2">In Just 90–120 Days</span>
        </h1>

        <p className="sdp-hero-sub" data-sdp-reveal style={revealDelay(".12s")}>
          Using our <strong>Extreme or Nothing Protocol</strong>, designed to maximise fat loss,
          muscle development and physique progression during one focused transformation phase.
        </p>

        <p className="sdp-hero-lead" data-sdp-reveal style={revealDelay(".16s")}>
          <strong>1000+ men</strong> across India, US, UK, Australia, Germany, Ireland &amp; Qatar
          have used the <strong>Extreme or Nothing Protocol</strong> to push their natural physiques
          to a completely different level, achieving:
        </p>

        <div data-sdp-reveal style={revealDelay(".20s")}>
          <MarkerChips items={OUTCOMES} label="What the protocol is built to deliver" />
        </div>

        <a className="sdp-above-vsl" href="#sdp-vsl" data-sdp-reveal style={revealDelay(".24s")}>
          Watch The Short Video Below
          <ChevronDownGlyph />
        </a>

        <div data-sdp-reveal style={revealDelay(".28s")}>
          <VSLFrame />
        </div>

        <div data-sdp-reveal style={revealDelay(".32s")}>
          <CtaLockup />
        </div>

        <div className="sdp-cred-row" data-sdp-reveal style={revealDelay(".38s")}>
          {STATS.map((s) => (
            <div className="sdp-cred-card" key={s.label}>
              <div className="sdp-cred-num">{s.num}</div>
              <div className="sdp-cred-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
