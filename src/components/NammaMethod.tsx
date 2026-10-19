import { Section, SectionHeading, revealDelay } from "./sdp";

type Pillar = { letter: string; title: string; kannada?: string; body: string };

const PILLARS: Pillar[] = [
  {
    letter: "N",
    title: "Namma Oota",
    kannada: "ನಮ್ಮ ಊಟ · Our food",
    body: "Built from what’s cooked at home: rice, ragi mudde, dosa, akki rotti, sambar, palya, chicken or fish curry. We change portions and timing, not your food.",
  },
  {
    letter: "A",
    title: "Assessment On Day 1",
    body: "Body fat, muscle, waist, strength, photos and your work hours. Then we agree on one clear 90-day target together.",
  },
  {
    letter: "M",
    title: "Muscle-First Fat Loss",
    body: "4 workouts a week, about 45 minutes, gym or home. Built to protect your muscle so you don’t end up skinny fat.",
  },
  {
    letter: "M",
    title: "Monitored Every Week",
    body: "Weekly check-ins with Sandesh. Travel, deadlines, Dasara, weddings: the plan bends, it doesn’t break.",
  },
  {
    letter: "A",
    title: "After 90 Days",
    body: "You don’t stay on a plan forever. We move you to a simple routine so the belly stays off for good.",
  },
];

export function NammaMethod() {
  return (
    <Section id="method" band="light-alt">
      <div data-sdp-reveal>
        <SectionHeading
          eyebrow="BUILT FOR KANNADIGA WORKING MEN"
          title={
            <>
              Introducing The <em>NAMMA</em> Method
            </>
          }
          sub="A 90-day belly fat plan. Your food, your schedule, and a pro coach checking in every single week."
        />
      </div>

      <div className="sdp-namma-grid">
        {PILLARS.map((p, i) => (
          <article
            className="sdp-card sdp-namma-card"
            key={p.title}
            data-sdp-reveal
            style={revealDelay(`${0.06 + i * 0.05}s`)}
          >
            <span className="sdp-namma-letter" aria-hidden>
              {p.letter}
            </span>
            <h3 className="sdp-namma-title">{p.title}</h3>
            {p.kannada && <span className="sdp-namma-kn">{p.kannada}</span>}
            <p className="sdp-namma-body">{p.body}</p>
          </article>
        ))}
      </div>

      <p className="sdp-namma-close" data-sdp-reveal style={revealDelay(".1s")}>
        This isn’t a diet chart. It’s a coach who keeps adjusting until it works for your body.
      </p>
    </Section>
  );
}

export default NammaMethod;
