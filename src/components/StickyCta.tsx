"use client";

import { useEffect, useState } from "react";
import { ArrowGlyph, CHECKOUT_URL } from "./sdp";

/**
 * BEAT 12: THE STICKY CTA. Page chrome, not a section (so it is not gated).
 *
 * The skin's sweeping dark-glass bar: fixed to the bottom, blurred graphite
 * glass, a 1px accent seam sweeping across the top, sliding up from below.
 *
 * WHEN IT SHOWS: once the hero has scrolled out of view, and it hides again the
 * moment the finale is on screen: the page's own CTA is right there, and two
 * buttons competing at the close is the standard way this component turns into
 * clutter. Because it hides at the finale, it needs no spacer in normal flow.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COPY FLAG: THE LABEL IS TRIMMED, AND THE TRIM IS A CHOICE TO APPROVE.
 * The page's CTA sentence is "CLICK HERE TO GET YOUR PERSONALISED DIAGNOSIS &
 * TRANSFORMATION ROADMAP →". At bar height that wraps to three lines on a
 * phone, so this uses a shortened form built only from the source's own words,
 * with the ₹97 from the hero's stat band welded on:
 *
 *      GET YOUR DIAGNOSIS & ROADMAP · ₹97
 *
 * Nothing new is claimed and nothing is added; "Click here to", "Personalised"
 * and "Transformation" are dropped for width. Change LABEL / PRICE below if
 * Atul wants a different trim.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Fail-safe: if JS never runs the bar simply stays off-screen (it is chrome, not
 * content, so nothing is lost). While it is off-screen it is `inert` and
 * aria-hidden, so it is never a phantom tab stop or a duplicate reading of the
 * offer.
 *
 * Client component.
 */

const LABEL = "Get Your Diagnosis & Roadmap";
const PRICE = "₹97";
const NOTE = "100% MONEY-BACK GUARANTEE";
const TITLE = "Extreme or Nothing Protocol";

export function StickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [atFinale, setAtFinale] = useState(false);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setPastHero(true);
      return;
    }

    const observers: IntersectionObserver[] = [];

    const hero = document.getElementById("top");
    if (hero) {
      const io = new IntersectionObserver(
        ([entry]) => setPastHero(!entry.isIntersecting),
        { threshold: 0 },
      );
      io.observe(hero);
      observers.push(io);
    } else {
      setPastHero(true);
    }

    const finale = document.getElementById("finale");
    if (finale) {
      const io = new IntersectionObserver(
        ([entry]) => setAtFinale(entry.isIntersecting),
        { threshold: 0.12 },
      );
      io.observe(finale);
      observers.push(io);
    }

    return () => observers.forEach((io) => io.disconnect());
  }, []);

  const on = pastHero && !atFinale;

  return (
    <div className={`sdp-stuck${on ? " on" : ""}`} inert={!on} aria-hidden={!on}>
      <div className="sdp-wrap sdp-stuck-inner">
        <div className="sdp-stuck-meta">
          <span className="sdp-stuck-title">{TITLE}</span>
          <span className="sdp-stuck-note">
            <span className="sdp-stuck-dot" aria-hidden />
            {NOTE}
          </span>
        </div>

        <a className="sdp-stuck-btn" href={CHECKOUT_URL}>
          <span>
            {LABEL} · {PRICE}
          </span>
          <span className="arrow" aria-hidden>
            <ArrowGlyph />
          </span>
        </a>
      </div>
    </div>
  );
}

export default StickyCta;
