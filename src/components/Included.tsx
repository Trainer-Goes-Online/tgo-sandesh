import { CtaLockup, Section, SectionHeading, revealDelay } from "./sdp";

/**
 * BEAT 7: "EVERYTHING INCLUDED IN YOUR 90–120 DAY TRANSFORMATION".
 *
 * Shape: ACCUMULATION with an order inside it. Six deliverables that add up to
 * the programme, and they are not interchangeable, the assessment comes first
 * because it sets the baseline, the peak-and-transition plan comes last because
 * it ends the phase. The source copy numbers them itself, so the numbering is
 * the client's, not a decoration. Category §3 Accumulation (read through §1's
 * ordinals), component: the numbered pillar cards on the skin's card DNA.
 *
 * NOT the itemized value ledger: that option puts a rupee value on every row,
 * and this copy prices nothing. Inventing per-item values would be a fabricated
 * claim, so the component that would demand them is the wrong one.
 *
 * COPY: verbatim: the headline, the deck, all six titles and all six bodies, in
 * order. The only rendering change is the ordinal: the source's "1." through
 * "6." are set as 01 through 06 in the skin's numbered tile, which is a numeral
 * treatment, not a copy edit.
 *
 * The CTA lockup closes the section: this is the beat where the reader has just
 * been told what he gets, which is the blueprint's standard place to ask.
 *
 * Band: light-alt (the skin's constant, Programme sits on the alt band).
 * Server component.
 */

const INCLUSIONS: { title: string; body: string }[] = [
  {
    title: "COMPLETE PHYSIQUE & PERFORMANCE ASSESSMENT",
    body: "We start by establishing exactly where your physique stands today through body composition analysis, skinfold measurements, strength and endurance testing, training history and physique assessment. This gives us a clear baseline and identifies the muscle groups, proportions and areas that need the most work.",
  },
  {
    title: "PERSONALISED PROGRESSIVE TRAINING PLAN",
    body: "Your training is built around your current capacity, physique goals and underdeveloped muscle groups. We progressively manipulate volume, intensity, loads and advanced techniques as your body adapts, so your training keeps moving forward instead of repeating the same workouts for months.",
  },
  {
    title: "PRECISION NUTRITION, MACRO & MICRO PLANNING",
    body: "Your calories, macronutrients and key micronutrients are planned around your body composition, training demands and transformation goal. As your physique progresses, your nutrition is adjusted to support fat loss, muscle development, performance and recovery.",
  },
  {
    title: "WEEKLY CHECK-INS & ACCOUNTABILITY",
    body: "Your body weight, measurements, progress photos, training performance and adherence are reviewed regularly. Training and nutrition are adjusted based on what your body is actually doing, so you always know exactly what needs to happen next.",
  },
  {
    title: "EXERCISE FORM & TECHNIQUE CORRECTION",
    body: "Your exercise execution is reviewed to make sure you're actually training the intended muscles and getting more from every working set. You receive form corrections, technique guidance and exercise adjustments wherever required.",
  },
  {
    title: "PEAK PHYSIQUE & TRANSITION PLAN",
    body: "Your transformation has a defined deadline for reaching peak condition, so you’re never stuck endlessly “working on your physique.” As that deadline approaches, training and nutrition are tightened to maximise definition, muscularity and overall physique presentation, followed by a structured transition towards greater flexibility and long-term maintenance.",
  },
];

export function Included() {
  return (
    <Section id="whats-included" band="light-alt">
      <div data-sdp-reveal>
        <SectionHeading
          title={
            <>
              Everything Included In Your
              <br className="sdp-br-lg" /> <em>90–120 Day Transformation</em>
            </>
          }
          sub="Everything you need to lose fat, develop muscle and push your natural physique towards its peak."
        />
      </div>

      <div className="sdp-prog-grid">
        {INCLUSIONS.map((item, i) => (
          <article
            className="sdp-card sdp-prog-card"
            key={item.title}
            data-sdp-reveal
            style={revealDelay(`${0.06 + i * 0.05}s`)}
          >
            <div className="sdp-prog-head">
              <span className="sdp-pillar-num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="sdp-prog-title">{item.title}</h3>
            </div>
            <p className="sdp-prog-body">{item.body}</p>
          </article>
        ))}
      </div>

      <div data-sdp-reveal style={revealDelay(".1s")}>
        <CtaLockup />
      </div>
    </Section>
  );
}

export default Included;
