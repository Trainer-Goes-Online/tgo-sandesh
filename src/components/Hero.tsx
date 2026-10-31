import type { ReactNode } from "react";
import {
  BowlGlyph,
  CtaLockup,
  GatePill,
  MarkerChips,
  StarGlyph,
  revealDelay,
} from "./sdp";

const FEATURES = [
  "Built Around Office Hours",
  "45-Minute Workouts",
  "Gym Or Home",
  "Weekly Check-Ins",
  "Kannada & English Support",
];

const COACH_STATS: { num: ReactNode; label: string }[] = [
  { num: "1000+", label: "Men coached" },
  { num: "8+ yrs", label: "Coaching" },
  {
    num: (
      <>
        4.9
        <span className="sdp-coach-stars" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <StarGlyph key={i} size={12} />
          ))}
        </span>
      </>
    ),
    label: "Client rating",
  },
];

export function Hero() {
  return (
    <section id="top" className="sdp-hero">
      <div className="sdp-wrap sdp-hero-inner">
        <GatePill>
          FOR KANNADIGA WORKING PROFESSIONALS, ENTREPRENEURS &amp; BUSINESS OWNERS (30+)
        </GatePill>

        <h1 className="sdp-h1" data-sdp-reveal style={revealDelay(".06s")}>
          <span className="sdp-h1-l1 is-long">
            I’ll Help You Lose 8–15 Kg &amp;
            <br className="sdp-br-lg" /> Your Stubborn Belly Fat
          </span>
          <span className="sdp-h1-l2">In Just 90 Days</span>
        </h1>

        <p className="sdp-hero-promise" data-sdp-reveal style={revealDelay(".1s")}>
          Or I’ll keep coaching you at no extra cost until you get there.
        </p>

        <p className="sdp-hero-sub" data-sdp-reveal style={revealDelay(".14s")}>
          Using my <strong>NAMMA Method</strong>, backed by{" "}
          <strong>1000+ men coached across 7 countries</strong>. Karnataka-friendly nutrition, 4
          short workouts a week and weekly 1:1 check-ins, so the belly comes off <em>without</em>{" "}
          losing muscle and ending up skinny fat.
        </p>

        <div data-sdp-reveal style={revealDelay(".18s")}>
          <p className="sdp-food-note">
            <span className="sdp-food-note-icon" aria-hidden>
              <BowlGlyph />
            </span>
            <span>
              <b>No giving up ragi mudde, rice or dosa.</b> No boiled-chicken diets. No living in
              the gym.
            </span>
          </p>
        </div>

        <div className="sdp-coach-card" data-sdp-reveal style={revealDelay(".22s")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="sdp-coach-photo"
            src="/sandesh-portrait.webp"
            alt="Sandesh Soans"
            width={120}
            height={120}
          />
          <div className="sdp-coach-body">
            <span className="sdp-coach-eyebrow">Your Coach</span>
            <span className="sdp-coach-name">Sandesh Soans</span>
            <p className="sdp-coach-desc">
              4x natural bodybuilding pro who now coaches busy working Kannadiga men.
            </p>
            <div className="sdp-coach-stats">
              {COACH_STATS.map((s) => (
                <div className="sdp-coach-stat" key={s.label}>
                  <span className="sdp-coach-num">{s.num}</span>
                  <span className="sdp-coach-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div data-sdp-reveal style={revealDelay(".26s")}>
          <CtaLockup note="Sandesh takes a limited number of calls each week" />
        </div>

        <div data-sdp-reveal style={revealDelay(".3s")}>
          <MarkerChips items={FEATURES} label="How the plan fits your week" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
