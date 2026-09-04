import { CheckGlyph, Section, ShieldGlyph, revealDelay } from "./sdp";

/**
 * BEAT 8: THE GUARANTEE. The page's second DARK band.
 *
 * Shape: an ASSURANCE plus a set of CONDITIONS, and those are two different
 * things, so they get two different objects.
 *
 *   1. The promise is the seal: the skin's dark guarantee card (Part 2,
 *      untouched): accent top bar, rotated shield tile, one headline, one
 *      paragraph, centred. Nothing else is allowed inside it.
 *   2. The five conditions are a CONTRACT, so they sit below the seal as their
 *      own terms ledger, hairline-ruled, lead line in solid ink over its detail
 *      sentence.
 *
 * WHY THEY ARE SEPARATED: the moment a list of requirements is printed inside
 * the seal, the promise reads as conditional and the beat stops doing its job.
 * Outside it, the same five items read as fair terms and the promise stays
 * whole. The copy already makes this split itself ("What We Ask In Return" is a
 * heading, not a bullet), so the layout is following the copy, not overriding it.
 *
 * COPY: verbatim: the eyebrow line, both headline lines, the promise
 * paragraph, the "What We Ask In Return" heading and all five conditions with
 * their detail sentences. The ✓ characters render as the drawn check.
 *
 * NOTE ON THE FIFTH CONDITION: the source gives it a lead line and no detail
 * sentence. It is rendered exactly that way, a shorter row, rather than
 * padded out with invented wording.
 *
 * Server component.
 */

/** [the condition, its detail sentence if the source gives one], verbatim. */
const TERMS: [string, string?][] = [
  [
    "Your starting point is assessed on Day 1.",
    "We establish your baseline using body composition, measurements, progress photos and relevant performance markers.",
  ],
  [
    "Your 90–120 day transformation target is agreed upfront.",
    "Based on your baseline, training history and goals, we establish clear and realistic physique outcomes for your transformation.",
  ],
  [
    "You follow the protocol consistently.",
    "Complete your prescribed training, follow your nutrition targets, attend weekly check-ins and implement the adjustments provided throughout the programme.",
  ],
  [
    "Your progress is tracked throughout the programme.",
    "Submit your required weight, measurements, progress photos and training data so your results can be reviewed against your starting baseline.",
  ],
  ["The guarantee runs from your official programme start date."],
];

export function Guarantee() {
  return (
    <Section id="guarantee" band="dark">
      <div className="sdp-guarantee-card" data-sdp-reveal>
        <div className="sdp-guarantee-icon" aria-hidden>
          <ShieldGlyph size={42} />
        </div>

        <div className="sdp-eyebrow center">100% MONEY-BACK GUARANTEE</div>

        <h2 className="sdp-guarantee-title">
          You Bring The Commitment.
          <br className="sdp-br-lg" /> We’ll Guarantee The Transformation.
        </h2>

        <p className="sdp-guarantee-copy">
          If you don’t achieve the physique transformation agreed upon at the start of your
          programme, despite following your personalised protocol consistently, we’ll refund every
          rupee you paid us.
        </p>
      </div>

      <div className="sdp-terms">
        <div data-sdp-reveal style={revealDelay(".06s")}>
          <h3 className="sdp-terms-head">What We Ask In Return</h3>
          <div className="sdp-terms-rule" aria-hidden />
        </div>

        <ul className="sdp-terms-list">
          {TERMS.map(([lead, detail], i) => (
            <li key={lead} data-sdp-reveal style={revealDelay(`${0.1 + i * 0.05}s`)}>
              <span className="ck" aria-hidden>
                <CheckGlyph />
              </span>
              <span>
                <span className="sdp-terms-lead">{lead}</span>
                {detail && <span className="sdp-terms-detail">{detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export default Guarantee;
