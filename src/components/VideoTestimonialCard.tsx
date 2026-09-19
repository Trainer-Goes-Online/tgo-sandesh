/**
 * BEAT 4b (unit), one video testimonial card.
 *
 * ── REBUILT 2026-09-10, films delivered ───────────────────────────────────
 * The Vimeo player is mounted DIRECTLY, matching how tgo-deepti was set up on
 * Atul's instruction: Vimeo draws its own thumbnail and its own play control,
 * so there is no poster frame to source and no placeholder to maintain.
 *
 * WHAT THAT RETIRED, and it is worth knowing rather than discovering:
 *  · The LIGHTBOX. The card used to be a button opening a dimmed, scroll
 *    locked overlay. With the player in the card there is nothing to open.
 *    Playback now happens in the rail, which is why the rail pauses on hover
 *    and on focus-within: you cannot press play on a moving target.
 *  · The client island. No lightbox means no state, no Escape handler and no
 *    focus juggling, so this is a server component now and the row costs no
 *    JS at all.
 *  · The `poster` prop and the inert placeholder branch. Neither has anything
 *    left to do.
 *
 * §6's vary-adjacent-proof rule still holds: the row above is a before/after
 * pair track, this is a set of faces talking. Different evidence, different
 * shape. Only the way the video opens has changed.
 *
 * LAZY, deliberately. Fifteen films doubled by the rail's seamless loop is
 * thirty players in the DOM, and eager iframes would be thirty third-party
 * requests before a reader has scrolled anywhere near the proof beat.
 */

export type Testimonial = {
  /** Stable key. */
  id: string;
  /** Vimeo id. */
  vimeoId?: string;
  /** The client's first name, where it was supplied. Absent = no caption,
   *  rather than an invented one. */
  name?: string;
  /** What belongs in this frame, for whoever supplies the footage. Kept for
   *  the type's sake; nothing renders it now the films are in. */
  ask?: string;
};

/** Portrait: these are phone-recorded client videos. Change in ONE place if
 *  the delivered footage turns out to be landscape. */
const RATIO = "9/16";

export function VideoTestimonialCard({ vimeoId, name }: Omit<Testimonial, "id">) {
  if (!vimeoId) return null;

  return (
    <div className="sdp-vt-card is-live">
      <span className="sdp-vt-stage" style={{ aspectRatio: RATIO }}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
          title={name ? `${name}'s video testimonial` : "Client video testimonial"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
        {name && <span className="sdp-vt-name">{name}</span>}
      </span>
    </div>
  );
}

export default VideoTestimonialCard;
