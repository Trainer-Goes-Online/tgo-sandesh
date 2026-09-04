"use client";

import { useState } from "react";
import { PlusGlyph, Section, SectionHeading } from "./sdp";

/**
 * BEAT 10: FAQ.
 *
 * Shape: an OBJECTION SET. Seven doubts, each answered once. Category §5
 * Objection, component: the ruled FAQ ledger, the skin's rows, where open
 * means the row turns white, takes the accent border and the + icon rotates 45°
 * into a ×. The first question opens by default so the component announces
 * itself as answerable rather than as seven closed doors.
 *
 * `Q.01`–`Q.07` ordinals are the ledger's own chrome (they make the set read as
 * audited and countable, and they give the reader a sense of how much is left).
 * They are numerals, not copy.
 *
 * COPY: all seven questions and all seven answers verbatim, in the source md's
 * order, nothing merged or trimmed. No "Most asked" flag is attached to any row:
 * the source doesn't say which is most asked, and the pill would be a claim.
 *
 * One question is open at a time: the answers are long enough that two open
 * rows would push the third off the screen and make the set feel unfinished.
 *
 * Client component (it owns one piece of state and nothing else).
 */

const QA: [string, string][] = [
  [
    "Is the entire transformation natural?",
    "Yes. The Extreme or Nothing Protocol is built around natural physique development. The goal is to discover how far you can take your own physique through structured training, nutrition, recovery and consistent execution.",
  ],
  [
    "I’ve been training for years. Why would this get me further than what I’m already doing?",
    "Because the goal isn’t simply to get you training consistently. We assess your current physique, training history, strength, body composition and underdeveloped muscle groups, then progressively adjust your training volume, intensity and nutrition as your body adapts. The focus is on continuous physique progression, not repeating the same routine and hoping for a different result.",
  ],
  [
    "What exactly does “Extreme or Nothing” mean? Do I have to make fitness my entire life?",
    "No. “Extreme” refers to the standard of execution during a defined 90–120 day transformation phase, not living an extreme lifestyle forever. You’ll be expected to train, eat, recover and check in with a higher level of discipline for this period. Once the transformation is complete, we transition you towards greater flexibility while maintaining what you’ve built.",
  ],
  [
    "Do I need to be an advanced lifter or already in great shape?",
    "No. You don't need an athlete's physique to start. Your training volume and intensity are built around your current capacity and experience level, then progressively increased as you become capable of handling more. Your results depend on where you're starting from, the goal is to take you from that starting point to the best physique you're capable of achieving within your 90 to 120 day transformation phase, not a fixed, one-size-fits-all outcome.",
  ],
  [
    "Will I have to follow an extremely restrictive diet for 90–120 days?",
    "Your nutrition will be precise, but it is built around your body, calorie requirements, macros and transformation phase. As your body composition changes, your nutrition is adjusted accordingly. The objective is not unnecessary restriction. It is giving your body what it needs to produce the result you’re chasing.",
  ],
  [
    "What happens once the 90–120 day transformation is over?",
    "You don’t stay in transformation mode forever. Once you reach your target condition, we move into a transition phase, gradually introducing more flexibility and adjusting nutrition where required so you can maintain or continue building your physique without permanently living at transformation-level intensity.",
  ],
  [
    "What if I follow everything and still don’t achieve the agreed transformation?",
    "If you follow your personalised protocol consistently, complete your training and nutrition requirements, submit your check-ins and progress data, and still don’t achieve the physique transformation agreed at the beginning of your programme, you’ll be covered by the 100% Money-Back Guarantee, subject to the guarantee terms outlined on this page.",
  ],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" band="light">
      <div data-sdp-reveal>
        <SectionHeading
          title={
            <>
              COMMON QUESTIONS FROM
              <br className="sdp-br-lg" /> <em>MEN READY TO BUILD THEIR BEST NATURAL PHYSIQUE</em>
            </>
          }
        />
      </div>

      <div className="sdp-faq">
        {QA.map(([q, a], i) => {
          const isOpen = open === i;
          const id = `faq-${i + 1}`;
          return (
            <div className={`sdp-q${isOpen ? " open" : ""}`} key={q}>
              <button
                type="button"
                className="sdp-q-head"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="sdp-q-ask">
                  <span className="sdp-q-ord" aria-hidden>
                    Q.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{q}</span>
                </span>
                <span className="ic" aria-hidden>
                  <PlusGlyph />
                </span>
              </button>
              <div className="sdp-q-body" id={id} role="region">
                <div className="sdp-q-body-inner">{a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export default Faq;
