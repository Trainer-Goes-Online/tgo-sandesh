import { MediaPlaceholder, Section, SectionHeading, revealDelay } from "./sdp";

/**
 * BEAT 5b: "MY STORY IN MY OWN WORDS".
 *
 * THIS BEAT HAS NO SHAPE, AND THAT IS THE POINT. It is first-person narrative:
 * a man telling you, in order, what he did. There is no sequence to number, no
 * contrast to weigh, no set to ledger. Forcing a timeline or a card grid onto it
 * would be the design equivalent of a fabricated claim, and it would kill the
 * one thing the beat is for: sounding like a person rather than a brochure.
 *
 * So the prose stays TEXT, exactly as the VSL blueprint marks this beat. The
 * only treatment is editorial: a framed photograph beside each passage, sides
 * alternating down the page, and the copy set at reading width with the writer's
 * own short lines kept as short lines. That is layout, not structure.
 *
 * COPY: verbatim, every line, in the source md's order. Nothing is merged,
 * trimmed, re-voiced or emphasised.
 *
 * NO PHOTOGRAPHY EXISTS. Each frame is a 4:5 placeholder at the exact final size
 * and its ask is THE SOURCE COPY'S OWN BRACKETED BRIEF, quoted as written, so
 * the shot list comes straight off the page.
 *
 * Server component.
 */

type StoryBeat = {
  /** The bracketed photo brief from the source md, verbatim. */
  brief: string;
  /** The passage, one entry per line as the writer set it. */
  lines: string[];
};

const BEATS: StoryBeat[] = [
  {
    brief: "PHOTOS Younger Sandesh / BCA graduation / early fitness days",
    lines: [
      "I graduated with a BCA degree in 2018 with two IT job opportunities in front of me.",
      "I turned both down.",
      "I knew I wanted to build my life around fitness, so I started as a gym trainer and worked my way up to Personal Trainer, Head Coach and Fitness Manager, while continuing to study, get certified and transform my own physique.",
      "But I never wanted to simply look “fit”.",
      "I wanted to know how far I could take my body naturally.",
    ],
  },
  {
    brief: "PHOTOS: Fitter Transformation Challenge before/after + ranking proof",
    lines: [
      "That question pushed me to start coaching myself.",
      "My own training. Nutrition. Conditioning. Recovery.",
      "I eventually entered the Fitter Transformation Challenge and finished in the Top 20 amongst approximately 16,000–17,000 participants.",
      "But for me, that wasn't the finish line.",
      "It showed me there was another level I could reach.",
    ],
  },
  {
    brief: "PHOTOS: Stage photographs + Pro Cards",
    lines: [
      "So I took things further into natural bodybuilding.",
      "I self-coached my entire journey to professional status, eventually earning 4 Pro Cards across natural bodybuilding federations in India.",
      "That made me the first Indian to achieve Pro Cards across these federations through a completely self-coached journey.",
    ],
  },
  {
    brief: "PHOTOS: International competition / India representation",
    lines: [
      "I then had the opportunity to represent India internationally, where I placed 5th in the Fitness Model category.",
      "By then, I had learned firsthand what separates simply working out from deliberately building an exceptional physique.",
      "And I wanted to see if those same principles could work for others.",
    ],
  },
  {
    brief: "PHOTOS: Sandesh with athletes + medals / winning clients",
    lines: [
      "Since then, I’ve coached athletes to Gold, Silver & Bronze Medals, Pro Cards, Overall Titles, Champion Posing and Conditioning Awards, while helping everyday clients transform their physiques across India, US, UK, Australia, Germany, Ireland & Qatar.",
      "And it taught me something important:",
      "You don’t need to become a bodybuilder to benefit from the standards that build one.",
    ],
  },
  {
    brief: "PHOTOS: January 1, 2026 → current physique progress",
    lines: [
      "On January 1st, 2026, I decided to put that belief to the test again.",
      "I began my own 365-Day Extreme or Nothing journey, committing an entire year to seeing how far I can push my physique, fitness and personal standards.",
      "And I’m doing this while building a business, coaching clients and managing a demanding schedule of my own.",
      "And I’m still living that journey today.",
      "Because Extreme or Nothing isn't simply something I coach.",
      "It’s the standard I choose to live by.",
    ],
  },
];

export function FounderStory() {
  return (
    <Section id="my-story" band="light">
      <div data-sdp-reveal>
        <SectionHeading
          title={
            <>
              My Story In <em>My Own Words</em>
            </>
          }
        />
      </div>

      <div className="sdp-story">
        {BEATS.map((beat, i) => (
          <article
            className={`sdp-story-beat${i % 2 === 1 ? " is-flip" : ""}`}
            key={beat.brief}
            data-sdp-reveal
            style={revealDelay(".04s")}
          >
            <figure className="sdp-story-frame">
              <MediaPlaceholder ratio="4/5" tag="Photo needed" label={beat.brief} />
            </figure>
            <div className="sdp-story-copy">
              {beat.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

export default FounderStory;
