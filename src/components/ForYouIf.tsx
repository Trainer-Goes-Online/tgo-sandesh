import { CheckGlyph, Section, SectionHeading, revealDelay } from "./sdp";

/** [bold lead, the rest of the sentence] */
const ITEMS: [string, string][] = [
  [
    "You sit at a desk 9 to 10 hours a day,",
    "and your belly has grown a little every year since you started working.",
  ],
  ["You’ve joined a gym 2 or 3 times", "and stopped within a month because work took over."],
  [
    "You’ve tried cutting rice or skipping dinner,",
    "lost a few kg, and got it all back in a few weeks.",
  ],
  [
    "Your shirts are tight around the stomach",
    "and you’ve started avoiding photos at family functions.",
  ],
  [
    "You don’t need more fitness videos.",
    "You want someone to tell you exactly what to eat and what to do this week.",
  ],
  [
    "You can give 4 sessions a week for 90 days.",
    "Not your whole life. Just 90 days with a proper plan.",
  ],
];

export function ForYouIf() {
  return (
    <Section id="for-you" band="light">
      <div data-sdp-reveal>
        <SectionHeading
          eyebrow="FOR BUSY MEN WHO ARE DONE STARTING OVER"
          title={
            <>
              This Is For <em>You</em> If:
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

      <p className="sdp-not-for" data-sdp-reveal style={revealDelay(".1s")}>
        <strong>Not for you if</strong> you want to lose 10 kg in 10 days, you’re looking for a pill
        or a crash diet, or you want to step on a bodybuilding stage.
      </p>
    </Section>
  );
}

export default ForYouIf;
