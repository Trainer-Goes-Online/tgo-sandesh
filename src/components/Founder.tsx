import { Section, revealDelay } from "./sdp";

const CREDENTIALS = [
  "4X NATURAL PRO CARDS",
  "REPRESENTED INDIA · 5TH INTERNATIONALLY",
  "1000+ MEN COACHED",
  "FROM KARNATAKA",
];

export function Founder() {
  return (
    <Section id="coach" band="dark">
      <div className="sdp-founder-grid">
        <div className="sdp-founder-sticky" data-sdp-reveal style={revealDelay(".06s")}>
          <div className="sdp-founder-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="sdp-founder-photo"
              src="/sandesh-portrait.webp"
              alt="Sandesh Soans"
              width={950}
              height={1689}
            />
          </div>
        </div>

        <div className="sdp-founder-copy">
          <div data-sdp-reveal>
            <div className="sdp-eyebrow">YOUR COACH</div>
            <h2 className="sdp-founder-title">
              Why A Bodybuilding Pro Now Coaches <em>Only Working Men</em>
            </h2>
          </div>

          <div className="sdp-cred-pills" data-sdp-reveal style={revealDelay(".1s")}>
            {CREDENTIALS.map((c) => (
              <span className="sdp-cred-pill" key={c}>
                {c}
              </span>
            ))}
          </div>

          <div data-sdp-reveal style={revealDelay(".14s")}>
            <p>
              I turned down two IT jobs after my BCA in 2018 to become a gym trainer. Over the next
              few years I coached myself to 4 natural bodybuilding pro cards, represented India
              internationally, and prepared athletes who won gold, silver and bronze.
            </p>
            <p>
              But by the end of 2025, I wasn’t happy anymore. Competition isn’t real life. Most men
              don’t want to step on a stage or live like an athlete all year.{" "}
              <b>
                They want to lose the belly, feel strong, look good in a shirt, and have energy
                after a long day at work.
              </b>
            </p>
            <p>
              So I stepped away from stage prep. The science that gets an athlete stage-ready is the
              same science that helps a 38-year-old manager lose his belly. The difference is how
              it’s applied: around your job, your family, and the food you grew up eating.
            </p>
            <p className="sdp-founder-pull">
              I’m from Karnataka. I know what’s on your plate, and I won’t ask you to give it up.
            </p>
            <span className="sdp-founder-sign">Sandesh Soans</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default Founder;
