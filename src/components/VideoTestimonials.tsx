import { Rail } from "./Rail";
import { Section, revealDelay } from "./sdp";
import { VideoTestimonialCard, type Testimonial } from "./VideoTestimonialCard";

/**
 * BEAT 4b: the four video testimonials.
 *
 * Shape: a PROOF SET, same job as the before/after row above, different
 * evidence: a man saying it himself. Category §6 Proof, component: the lightbox
 * testimonial card: chosen precisely BECAUSE the row above it is the
 * before/after pair track (§6's vary-adjacent-proof rule: never run the same
 * proof option twice in a row).
 *
 * NO HEADING. The source copy gives this row none: it sits under beat 4a's
 * "SEE FOR YOURSELF." heading and reads as its second movement. Rather than
 * invent a headline, it runs headless on the next band, so the two proof rows
 * read as one argument told two ways.
 *
 * Server component; each card carries its own client-side lightbox.
 */

const COUNT = 4;

const TESTIMONIALS: Testimonial[] = Array.from({ length: COUNT }, (_, i) => ({
  id: `vt-${i + 1}`,
  ask: `Client video testimonial ${i + 1} of ${COUNT} (vertical recording, plus a poster frame)`,
}));

export function VideoTestimonials() {
  return (
    <Section id="video-proof" band="light" className="sdp-vt-section">
      <div data-sdp-reveal style={revealDelay(".04s")}>
        <Rail direction="right" repeat={2} seconds={56} label="Client video testimonials">
          {TESTIMONIALS.map((t) => (
            <VideoTestimonialCard key={t.id} vimeoId={t.vimeoId} poster={t.poster} ask={t.ask} />
          ))}
        </Rail>
      </div>
    </Section>
  );
}

export default VideoTestimonials;
