import { CheckGlyph, CtaLockup, Section, SectionHeading, revealDelay } from "./sdp";

/**
 * BEAT 2: "THIS IS FOR YOU IF" (self-recognition set).
 *
 * Shape: a recognition set, six statements the right reader nods at. Category
 * §2 Contrast, rendered as the VSL blueprint's default: the ONE-SIDED ✓ list in
 * a single centred column. Not the two-column for-you / not-for-you fit-check,
 * which is for offers that need to disqualify; this copy only needs the reader
 * to see himself.
 *
 * Copy is the source md's, verbatim and in its order. Two rendering choices,
 * no word changed:
 *   1. The all-caps line is the EYEBROW and the Title Case line is the H2. That
 *      is the copywriter's own signal (caps = kicker, Title Case = headline)
 *      and it matches the hero, where the caps gate line sits in the pill above
 *      the Title Case H1.
 *   2. The ✔ character becomes the drawn check inside the accent disc, and the
 *      first sentence of each item is set in solid ink so the six statements
 *      scan in one pass. Emphasis only; the sentences are untouched.
 *
 * The section closes with the CTA lockup because the source repeats the button,
 * the three badges and the 5-hour timer here. Server component.
 */

/** [recognition sentence, the sentence that qualifies it], both verbatim. */
const ITEMS: [string, string][] = [
  [
    "You’ve been training for years, but your physique still doesn’t reflect the amount of time and effort you’ve put into it.",
    "You’re not completely out of shape, but you’re nowhere close to looking the way you know you could.",
  ],
  [
    "You’ve made progress before, only to lose momentum and find yourself starting over again.",
    "You’re tired of constantly being “in progress” without ever completing the transformation.",
  ],
  [
    "You don’t just want to lose weight or “get fit.”",
    "You want visible abs, more muscle, better proportions and a physique that genuinely stands out.",
  ],
  [
    "You know more fitness information isn’t what you’re missing.",
    "You need the right structure, progression and accountability to push beyond the level you’ve been able to reach on your own.",
  ],
  [
    "You’re willing to make your physique a genuine priority for the next 90–120 days.",
    "You’d rather go all in for one focused transformation phase than spend another year making slow, inconsistent progress.",
  ],
  [
    "You want to discover how far you can naturally take your physique.",
    "Not to become a competitive bodybuilder, but to finally see what your body is capable of when your commitment matches your ambition.",
  ],
];

export function ForYouIf() {
  return (
    <Section id="for-you" band="light">
      <div data-sdp-reveal>
        <SectionHeading
          eyebrow="FOR MEN WHO ARE DONE LOOKING “FIT” & READY TO LOOK EXCEPTIONAL"
          title={
            <>
              This Is For <em>You</em> if:
            </>
          }
        />
      </div>

      <ul className="sdp-who-list">
        {ITEMS.map(([lead, rest], i) => (
          <li key={lead} data-sdp-reveal style={revealDelay(`${0.06 + i * 0.06}s`)}>
            <span className="ck" aria-hidden>
              <CheckGlyph />
            </span>
            <span>
              <strong>{lead}</strong> {rest}
            </span>
          </li>
        ))}
      </ul>

      <div data-sdp-reveal style={revealDelay(".1s")}>
        <CtaLockup />
      </div>
    </Section>
  );
}

export default ForYouIf;
