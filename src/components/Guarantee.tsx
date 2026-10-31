import { Section, ShieldGlyph } from "./sdp";

export function Guarantee() {
  return (
    <Section id="guarantee" band="dark">
      <div className="sdp-guarantee-card" data-sdp-reveal>
        <div className="sdp-guarantee-icon" aria-hidden>
          <ShieldGlyph size={42} />
        </div>

        <div className="sdp-eyebrow center">THE NAMMA PROMISE</div>

        <h2 className="sdp-guarantee-title">
          Hit Your Target In 90 Days.
          <br className="sdp-br-lg" /> <em>Or I Keep Coaching You Until You Do.</em>
        </h2>

        <p className="sdp-guarantee-copy">
          On Day 1, we agree on your target together, like inches off your waist and body fat lost.
          You follow the plan and do your weekly check-ins. If you’re not there by Day 90, you keep
          getting coached by me at no extra cost until you are.
        </p>

        <p className="sdp-guarantee-fine">
          Full conditions in our <a href="/refund-policy">refund policy</a>.
        </p>
      </div>
    </Section>
  );
}

export default Guarantee;
