import { Rail } from "./Rail";
import { Section, revealDelay } from "./sdp";
import { VideoTestimonialCard, type Testimonial } from "./VideoTestimonialCard";

/**
 * BEAT 4b: the video testimonials.
 *
 * Shape: a PROOF SET, same job as the before/after row above, different
 * evidence: a man saying it himself. Category §6 Proof, chosen precisely
 * BECAUSE the row above it is the before/after pair track (§6's
 * vary-adjacent-proof rule: never run the same proof option twice in a row).
 *
 * NO HEADING. The source copy gives this row none: it sits under beat 4a's
 * "SEE FOR YOURSELF." heading and reads as its second movement. Rather than
 * invent a headline, it runs headless on the next band, so the two proof rows
 * read as one argument told two ways.
 *
 * ── FILMS DELIVERED 2026-09-10 ────────────────────────────────────────────
 * Fifteen, where the build was scaffolded for four. Four came with names;
 * the other eleven did not, so they run without a caption rather than with
 * an invented one. If those names arrive, add them to the list below and the
 * caption appears on its own.
 *
 * The players are mounted DIRECTLY, matching how tgo-deepti was set up: no
 * poster frames to source and no placeholder to maintain, because Vimeo draws
 * its own thumbnail and its own play control. That retired the lightbox this
 * card used to open. See the card component for the consequence.
 *
 * `repeat` is 1, not 2. It existed because four cards could not fill a wide
 * rail; fifteen fill it on their own, and every extra copy is fifteen more
 * players in the DOM.
 *
 * Server component.
 */

const TESTIMONIALS: Testimonial[] = [
  { id: "vt-nithin", vimeoId: "1222607026", name: "Nithin" },
  { id: "vt-aseem", vimeoId: "1222607040", name: "Aseem" },
  { id: "vt-anish", vimeoId: "1222607044", name: "Anish" },
  { id: "vt-vishwas", vimeoId: "1222607033", name: "Vishwas" },
  { id: "vt-05", vimeoId: "1224194347" },
  { id: "vt-06", vimeoId: "1224194260" },
  { id: "vt-07", vimeoId: "1224193999" },
  { id: "vt-08", vimeoId: "1224194317" },
  { id: "vt-09", vimeoId: "1224193992" },
  { id: "vt-10", vimeoId: "1224194136" },
  { id: "vt-11", vimeoId: "1224193993" },
  { id: "vt-12", vimeoId: "1224194307" },
  { id: "vt-13", vimeoId: "1224194290" },
  { id: "vt-14", vimeoId: "1224193994" },
  { id: "vt-15", vimeoId: "1224194023" },
];

export function VideoTestimonials() {
  return (
    <Section id="video-proof" band="light" className="sdp-vt-section">
      <div data-sdp-reveal style={revealDelay(".04s")}>
        <Rail direction="right" repeat={1} seconds={140} label="Client video testimonials">
          {TESTIMONIALS.map((t) => (
            <VideoTestimonialCard key={t.id} vimeoId={t.vimeoId} name={t.name} ask={t.ask} />
          ))}
        </Rail>
      </div>
    </Section>
  );
}

export default VideoTestimonials;
