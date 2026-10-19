import { Section, revealDelay } from "./sdp";

export function WhyBelly() {
  return (
    <Section id="why" band="dark">
      <div className="sdp-why-grid">
        <div data-sdp-reveal>
          <div className="sdp-eyebrow">WHY THE BELLY KEEPS COMING BACK</div>
          <h2 className="sdp-why-title">
            Eating Less Is <em>Why</em> Your Belly Keeps Coming Back
          </h2>
          <p>
            Skip rice. Skip dinner. Walk in the morning. The scale drops a few kg. Then a busy month
            at work hits, the plan breaks, and the weight comes back. Usually with a softer belly
            than before.
          </p>
          <p>
            When you only cut food, you lose muscle along with fat. Less muscle means your body
            burns less, and you look soft even at a lower weight. That’s called being skinny fat.
          </p>
          <p className="sdp-why-fix">
            <b>The fix isn’t eating less. It’s keeping your muscle while the fat comes off.</b>{" "}
            That’s exactly what a natural bodybuilding pro knows how to do, and it works with the
            food you already eat at home.
          </p>
        </div>

        <div className="sdp-why-side" data-sdp-reveal style={revealDelay(".08s")}>
          <div className="sdp-why-path">
            <span className="sdp-why-path-label">What Most Men Try</span>
            <span className="sdp-why-path-flow">Cut Rice → Lose Muscle → Regain Belly</span>
          </div>
          <div className="sdp-why-path is-namma">
            <span className="sdp-why-path-label">The NAMMA Method</span>
            <span className="sdp-why-path-flow">Keep Your Food → Protect Muscle → Belly Stays Off</span>
          </div>
          <p className="sdp-why-note">
            Vishwa, a software developer working 10 to 12 hour days, lost 20 kg on his own and felt
            he looked worse. With Sandesh he went from 18% to 10% body fat without losing another
            kilo.
          </p>
        </div>
      </div>
    </Section>
  );
}

export default WhyBelly;
