import { MediaPlaceholder, Section, SectionHeading, revealDelay } from "./sdp";
import { Rail } from "./Rail";

/**
 * BEAT 4a: "HOW FAR CAN AN EVERYDAY MAN TAKE HIS PHYSIQUE NATURALLY? SEE FOR
 * YOURSELF.": nine before/after transformations.
 *
 * Shape: a PROOF SET whose unit is a pair. The meaning is not "here are nine
 * photographs", it is "here are nine same-man-twice comparisons", so the pair
 * is the card and the two frames sit side by side inside one border. Category
 * §6 Proof, component: the before/after pair track.
 *
 * §6's vary-adjacent rule is why this row and the video testimonials below it
 * are DIFFERENT options: silent paired stills here, lightbox video there.
 *
 * NO PHOTOGRAPHY EXISTS. Every frame is a 4:5 placeholder at the exact final
 * size, labelled with which man and which side of the pair it is, so nothing
 * reflows when the crops land.
 *
 * COPY NOTE: the source gives this beat as "Before/After (× 9)" only, no
 * names, no starting stats, no timeframes. The pairs therefore carry no claims
 * at all; nothing has been invented to fill them. See the build notes.
 *
 * Server component.
 */

const PAIR_COUNT = 9;

function BeforeAfterCard({ index }: { index: number }) {
  const n = index + 1;
  return (
    <article className="sdp-ba-card">
      <div className="sdp-ba-pair">
        <figure className="sdp-ba-half">
          <MediaPlaceholder ratio="4/5" tag="Photo needed" label={`Client ${n}, day 1`} />
          <figcaption className="sdp-ba-tag is-before">Before</figcaption>
        </figure>
        <figure className="sdp-ba-half">
          <MediaPlaceholder ratio="4/5" tag="Photo needed" label={`Client ${n}, final condition`} />
          <figcaption className="sdp-ba-tag is-after">After</figcaption>
        </figure>
      </div>
    </article>
  );
}

export function BeforeAfterTrack() {
  return (
    <Section id="transformations" band="light-alt">
      <div data-sdp-reveal>
        <SectionHeading
          title={
            <>
              HOW FAR CAN AN EVERYDAY MAN TAKE HIS PHYSIQUE{" "}
              <em>NATURALLY</em>?
              <br className="sdp-br-lg" /> SEE FOR YOURSELF.
            </>
          }
          sub="These men weren’t chasing trophies or Pro Cards. They were chasing a physique most men never find out they’re capable of building."
        />
      </div>

      <div data-sdp-reveal style={revealDelay(".06s")}>
        <Rail direction="left" seconds={86} label="Client before and after transformations">
          {Array.from({ length: PAIR_COUNT }, (_, i) => (
            <BeforeAfterCard key={i} index={i} />
          ))}
        </Rail>
      </div>
    </Section>
  );
}

export default BeforeAfterTrack;
