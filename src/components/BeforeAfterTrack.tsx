import { Section, SectionHeading, revealDelay } from "./sdp";
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
 * ── THE ARTWORK LANDED 2026-09-21 (Atul) ─────────────────────────────────
 * The placeholders are gone. What replaced them is NOT what this beat was
 * built for, and the card changed shape to match.
 *
 * EACH FILE IS ALREADY A PAIR. These are Sandesh's own "Success Stories"
 * graphics from @transformmebro, so the before and the after are composed
 * into one image, side by side, with the words BEFORE and AFTER set into the
 * artwork. So the card is ONE image now, not two halves, and it carries no
 * chips of its own: printing "Before" over a picture that already says
 * BEFORE is the page arguing with its own evidence.
 *
 * FIXED HEIGHT, NATURAL WIDTH, NO CROP. They arrive at two different ratios
 * (six near 0.89, three near 1.07) and several carry a client quote burned
 * into the top of the image. A uniform tile with object-fit:cover would slice
 * those lines off, which on a proof beat means cropping away the actual
 * testimony. Ragged widths are the correct outcome: it reads as a set of real
 * posts rather than a designed grid, which is what this evidence is.
 *
 * COPY NOTE: the source gives this beat as "Before/After (× 9)" only, no
 * names, no starting stats, no timeframes. Whatever claim each pair makes, it
 * makes inside its own artwork; nothing has been added around them.
 *
 * Server component.
 */

/* Nine files, renamed from the supplied screenshots on import: the originals
   were "Screenshot 2026-09-21 at 3.38.05 PM.png", which is a timestamp rather
   than a name and links back to nothing. Converted to WebP at 900px tall
   (10.5MB of PNG became 0.43MB) which is past 2x for the rail's height. */
const PAIRS = Array.from({ length: 9 }, (_, i) => `ba-${String(i + 1).padStart(2, '0')}.webp`);

function BeforeAfterCard({ src }: { src: string }) {
  return (
    <figure className="sdp-ba-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="sdp-ba-shot"
        src={`/before-after/${src}`}
        alt="A client's before and after transformation"
        height={900}
        loading="lazy"
        decoding="async"
      />
    </figure>
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
          {PAIRS.map((src) => (
            <BeforeAfterCard key={src} src={src} />
          ))}
        </Rail>
      </div>
    </Section>
  );
}

export default BeforeAfterTrack;
