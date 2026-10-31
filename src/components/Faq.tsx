"use client";

import { useState } from "react";

import { PRICE, inr } from "@/app/_legal/legal";

import { PlusGlyph, Section, SectionHeading } from "./sdp";

const QA: [string, string][] = [
  [
    "I’ve never been a gym person. Can I still do this?",
    "Yes. Most men who join have started and stopped before. Your plan starts at your current level and builds up week by week.",
  ],
  [
    "Do I have to stop eating rice?",
    "No. Rice, ragi, dosa and chapati all stay. We change how much and when, not what.",
  ],
  [
    "I work long hours and travel. Will this fit?",
    "Yes. Your training is planned around your actual work week. When you travel, we switch to a hotel or home workout and adjust your food for eating out.",
  ],
  [
    "I’m 40+. Is it too late?",
    "No. Your plan is built around your age, recovery and joints. The weekly check-ins mean we adjust the moment something doesn’t feel right.",
  ],
  ["Gym or home?", "Either. Tell us what you have access to and we build around it."],
  [
    "Can I speak in Kannada on the call?",
    "Yes. Kannada, English or both. Whatever you’re comfortable with.",
  ],
  [
    "What does the call cost? What happens on it?",
    `It’s a one-time ${inr(PRICE.amount)} booking fee. Sandesh looks at where you are today, what’s held you back, and what your 90 days would look like. If it’s not the right fit, he’ll tell you honestly.`,
  ],
  [
    "What happens after 90 days?",
    "You move to a simpler routine to keep the result. You don’t stay on a strict plan forever.",
  ],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Section id="faq" band="light" className="sdp-faq-plain">
      <div data-sdp-reveal>
        <SectionHeading
          eyebrow="BEFORE YOU BOOK"
          title={
            <>
              Questions Busy Men <em>Ask Us</em>
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
                <span className="sdp-q-ask">{q}</span>
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
