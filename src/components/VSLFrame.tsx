/**
 * BEAT 1 (focal media), the hero VSL frame.
 *
 * Anatomy is the skin's: an accent-lit frame around a 16:9 stage.
 *
 * ── FILM DELIVERED 2026-09-10 ─────────────────────────────────────────────
 * The Vimeo player is mounted DIRECTLY, matching the testimonial rail on this
 * page and how tgo-deepti was set up on Atul's instruction: Vimeo draws its
 * own thumbnail and its own play control, so there is no poster frame to
 * source and no placeholder to maintain.
 *
 * WHAT THAT RETIRED:
 *  · The click-to-swap. The stage used to hold a poster and swap in the
 *    player on click, which is why this was a client component. With the
 *    player already there, there is no state, so it is a server component and
 *    the hero's focal object costs no JS.
 *  · The custom play disc and its ripple ping. Both sat on top of the exact
 *    spot where Vimeo draws its own play button.
 *  · The `poster` prop and the placeholder branch.
 *
 * It also retires the honesty problem the old version was built around: there
 * is no longer a decorative play affordance that might front nothing, because
 * the only play control on the stage is the real player's.
 *
 * NOT lazy, deliberately. This is above the fold and is the beat the whole
 * page hands off to. The fifteen testimonial players further down are lazy.
 */

/** Client-supplied 2026-09-10: https://vimeo.com/1225511943 */
const VIMEO_ID = "1225511943";

export function VSLFrame({ vimeoId = VIMEO_ID }: { vimeoId?: string }) {
  return (
    <div className="sdp-video-frame">
      <div id="sdp-vsl" className="sdp-video has-video playing">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
          title="Extreme or Nothing Protocol"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default VSLFrame;
