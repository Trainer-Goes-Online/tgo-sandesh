import { CtaLockup, Section, SectionHeading, revealDelay } from "./sdp";
import { WatchCards, type WatchItem } from "./WatchCards";

type Result = { src: string };

const RESULTS: Result[] = [
  { src: "ba-08.webp" },
  { src: "ba-02.webp" },
  { src: "ba-06.webp" },
  { src: "ba-01.webp" },
  { src: "ba-03.webp" },
];

/* No Chandan film exists among the supplied Vimeo uploads, so his card has no id and renders disabled. */
const WATCH: WatchItem[] = [
  { label: "Watch how Chandan dropped to 12% body fat while working night shifts in Bengaluru" },
  {
    label: "Watch how Vishwas got in 4 months what he couldn't in almost 2 years on his own",
    vimeoId: "1222607033",
  },
  {
    label: "Watch how Aseem stays on track while working in the US and travelling for work",
    vimeoId: "1222607040",
  },
];

function ResultCard({ src }: Result) {
  return (
    <figure className="sdp-result-card">
      <div className="sdp-result-shot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/before-after/${src}`}
          alt="Client before and after transformation"
          loading="lazy"
          decoding="async"
        />
      </div>
    </figure>
  );
}

export function RealResults() {
  return (
    <Section id="results" band="light-alt">
      <div data-sdp-reveal>
        <SectionHeading
          eyebrow="NOT ATHLETES. NOT INFLUENCERS."
          title={
            <>
              Real Men. Real Jobs. <em>Real Results.</em>
            </>
          }
          sub="Working men with long days, families and deadlines. Just like you."
        />
      </div>

      <div className="sdp-result-grid">
        {RESULTS.map((r, i) => (
          <div key={r.src} data-sdp-reveal style={revealDelay(`${0.04 + i * 0.04}s`)}>
            <ResultCard {...r} />
          </div>
        ))}

        <div className="sdp-result-dark" data-sdp-reveal style={revealDelay(".24s")}>
          <div>
            <span className="sdp-result-kicker">Bengaluru · Night Shifts</span>
            <h3 className="sdp-result-big">Chandan: 17% → 12% Body Fat, +3.5 Kg Muscle</h3>
            <p>
              18 months stuck while working night shifts. In 3 months his plan was rebuilt around
              his sleep and shift timings, and his sleep got much better too.
            </p>
          </div>
          <div className="sdp-result-dark-split">
            <span className="sdp-result-kicker">Software Developer · 10 To 12 Hour Days</span>
            <h3 className="sdp-result-big">Vishwa: 18% → 10% Body Fat At The Same Weight</h3>
          </div>
        </div>
      </div>

      <div data-sdp-reveal style={revealDelay(".08s")}>
        <WatchCards items={WATCH} />
      </div>

      <div data-sdp-reveal style={revealDelay(".1s")}>
        <CtaLockup />
      </div>
    </Section>
  );
}

export default RealResults;
