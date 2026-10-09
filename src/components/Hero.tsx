import { VSLFrame } from "./VSLFrame";
import { ChevronDownGlyph, CtaLockup, GatePill, MarkerChips, revealDelay } from "./sdp";

/**
 * BEAT 1: HERO + VSL. The page's heaviest composite and its focal-media beat.
 *
 * Every string here is the source md's own, in the source md's order:
 *   gate pill -> two-line H1 -> "Even If..." line -> system line -> the
 *   "1000+ men across 7 countries ... includes:" lead -> six chips -> watch cue ->
 *   VSL -> CTA lockup (button, three badges, 5-hour countdown). The stat band
 *   that used to close the hero was removed on 2026-10-09; the "your call is
 *   with" card that replaced it now lives on /checkout.
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
  "Work-Schedule Friendly",
  "Step-By-Step 90-Day Plan",
  "Exactly What To Eat",
  "Exactly How To Train",
  "Beginner-Friendly Training",
  "Weekly Coach Support",
];


export function Hero() {
  return (
    <section id="top" className="sdp-hero">
      <div className="sdp-wrap sdp-hero-inner">
        <GatePill>
          FOR BUSY MEN 30-45 WHO WANT TO FINALLY GET RID OF THEIR STUBBORN BELLY
        </GatePill>

        <h1 className="sdp-h1" data-sdp-reveal style={revealDelay(".06s")}>
          <span className="sdp-h1-l1">
            Lose 8–10% Body Fat &amp;
            <br className="sdp-br-lg" />{" "}
            Watch Your Belly Shrink
          </span>
          <span className="sdp-h1-l2">In Just 90 Days</span>
        </h1>

        <p className="sdp-hero-even" data-sdp-reveal style={revealDelay(".09s")}>
          Even If You Have A Full-Time Job, Hate Complicated Diets &amp; Have Never Been A Gym
          Person.
        </p>

        <p className="sdp-hero-sub" data-sdp-reveal style={revealDelay(".12s")}>
          Using our{" "}
          <strong>
            <em>No-Guesswork Transformation System</em>
          </strong>{" "}
          where we tell you exactly what to eat, how to train and what to do each week to achieve
          your physique goals, without spending years figuring it out yourself.
        </p>

        <p className="sdp-hero-lead" data-sdp-reveal style={revealDelay(".16s")}>
          <strong>1000+ men</strong>{" "}across India, US, UK, Australia, Germany, Ireland &amp; Qatar
          have trusted Sandesh to help them achieve their fitness goals with a simple, structured
          approach that includes:
        </p>

        <div data-sdp-reveal style={revealDelay(".20s")}>
          <MarkerChips items={OUTCOMES} label="What the approach includes" />
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
      </div>
    </section>
  );
}

export default Hero;
