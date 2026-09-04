import { MediaPlaceholder, Section, revealDelay } from "./sdp";
import { Rail } from "./Rail";

/**
 * BEAT 3: "FROM FITNESS CREATORS TO PRO ATHLETES … THEY TRUST THE EXTREME OR
 * NOTHING PROTOCOL".
 *
 * Shape: BREADTH. Thirteen named people, no results attached, no quotes, the
 * meaning is the spread itself ("creators AND pro athletes, this many of them").
 * Category §7 Breadth / Range, component: the face + handle range grid, run on
 * two counter-scrolling rails because the source copy prints its own two
 * direction cues, one under each group.
 *
 * The split is the copy's split: six names above the first cue, seven below it.
 * Nobody is reordered and nobody is dropped.
 *
 * Every card is a real outbound link to that person's Instagram, new tab,
 * rel="noopener noreferrer": the proof only works if it can be checked. The
 * link is built from the handle rather than the copy's full share URL, because
 * the `igsh=` share tokens in the md are session tracking parameters, and one
 * of them (Chintu's) is truncated in the source. Same profile, no dead link.
 *
 * NO PHOTOGRAPHY EXISTS. Each face is a 4:5 placeholder holding the exact final
 * size, labelled with whose portrait belongs there, so the rails do not reflow
 * when the crops land.
 *
 * Server component.
 */

type Creator = { name: string; handle: string };

/** Group 1: above the copy's first movement cue. */
const RAIL_A: Creator[] = [
  { name: "Prathap", handle: "prathap.kannadigaa" },
  { name: "Deepak", handle: "biharibeast_27" },
  { name: "Bhaskar", handle: "bhaskar_b_g_" },
  { name: "Prakash", handle: "prakash.patel.__" },
  { name: "Michael", handle: "michaelajayofficial" },
  { name: "Sravan", handle: "__sravan.__" },
];

/** Group 2: below it. */
const RAIL_B: Creator[] = [
  { name: "Sai Kiran reddy", handle: "fitness_muchatlu" },
  { name: "Dinesh", handle: "dinesh_fitness0" },
  { name: "Badal Bist", handle: "badal_bist_" },
  { name: "Vivek Bist", handle: "vivek_bist_s" },
  { name: "Anish", handle: "anish_lifts06" },
  { name: "Vaijayanti", handle: "vaijayantiroopesh" },
  { name: "Chintu", handle: "chintu.kumar__" },
];

function InstagramGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CreatorCard({ name, handle }: Creator) {
  return (
    <a
      className="sdp-creator-card"
      href={`https://www.instagram.com/${handle}/`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="sdp-creator-shot">
        <MediaPlaceholder ratio="4/5" tag="Photo needed" label={`${name}, portrait crop`} />
      </div>
      <div className="sdp-creator-meta">
        <span className="sdp-creator-name">{name}</span>
        <span className="sdp-creator-handle">
          <InstagramGlyph />@{handle}
        </span>
      </div>
    </a>
  );
}

export function CreatorRails() {
  return (
    <Section id="trusted-by" band="dark">
      {/* The protocol gets its own identity here rather than a section
          masthead. Charcoal band, ivory type, and the name set as a stacked
          lockup under a thin copper rule: it is the only place on the page the
          offer is named as a product rather than described, so it is the one
          place the type is allowed to be the whole idea. The eyebrow and the
          "when physique matters" line stay verbatim above it. */}
      <div className="sdp-protocol" data-sdp-reveal>
        <p className="sdp-protocol-eyebrow">From Fitness Creators To Pro Athletes</p>
        <p className="sdp-protocol-lead">When Physique Matters, They Trust</p>
        <p className="sdp-protocol-mark" aria-label="The Extreme or Nothing Protocol">
          <span aria-hidden>The</span>
          {/* Two lines: the name, then the noun. "Extreme Or Nothing" is what
              the offer is called and "Protocol" is what it is, so the break
              falls where the meaning already does. */}
          <b aria-hidden>
            Extreme Or Nothing
            <br />
            Protocol
          </b>
        </p>
        <span className="sdp-protocol-rule" aria-hidden />
      </div>

      <div data-sdp-reveal style={revealDelay(".06s")}>
        <Rail direction="left" repeat={2} seconds={68} label="Fitness creators and athletes, part 1">
          {RAIL_A.map((c) => (
            <CreatorCard key={c.handle} {...c} />
          ))}
        </Rail>
      </div>

      <div className="sdp-rail-stack" data-sdp-reveal style={revealDelay(".1s")}>
        <Rail direction="right" repeat={2} seconds={78} label="Fitness creators and athletes, part 2">
          {RAIL_B.map((c) => (
            <CreatorCard key={c.handle} {...c} />
          ))}
        </Rail>
      </div>

      {/* The closing line of THIS section, not a beat of its own. It reads as
          the turn the section has been building to: those were the athletes,
          and you are not one, and it does not matter. Standing alone on its own
          band it read as a sentence nobody had asked for. The chevrons are the
          copy's three down-arrows, drawn rather than set as emoji, handing the
          eye to the transformations below. */}
      <div className="sdp-protocol-close" data-sdp-reveal style={revealDelay(".14s")}>
        <p className="sdp-protocol-but">But …</p>
        <p className="sdp-protocol-turn">
          You Don’t Need To Be An Athlete
          <br className="sdp-br-lg" /> To Build An <em>Exceptional Physique.</em>
        </p>
        <span className="sdp-descend" aria-hidden>
          <ChevronGlyph />
          <ChevronGlyph />
          <ChevronGlyph />
        </span>
      </div>
    </Section>
  );
}

function ChevronGlyph() {
  return (
    <svg width="24" height="13" viewBox="0 0 24 13" fill="none" aria-hidden>
      <path d="M2 2l10 9 10-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default CreatorRails;
