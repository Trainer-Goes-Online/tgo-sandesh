"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MediaPlaceholder, PlayGlyph } from "./sdp";

/**
 * BEAT 4b (unit), one video testimonial card, plus the lightbox it opens.
 *
 * The card is a poster in a framed stage with the accent play disc; clicking it
 * opens a dimmed, scroll-locked lightbox and plays there, so the proof row
 * itself stays calm and nothing autoplays. That is the §6 "lightbox
 * testimonial" option: deliberately NOT the option used by the before/after
 * row above it (§6 vary-adjacent-proof rule).
 *
 * NOTHING IS FAKED WHILE THE FILMS ARE MISSING. No testimonial video has been
 * delivered, so a card with no `vimeoId` renders as a labelled placeholder at
 * the exact final size with the disc dimmed and inert: there is no click target
 * that does nothing, and no fake poster. Supply `vimeoId` (and ideally
 * `poster`) and the same card becomes the real, clickable one with no layout
 * change.
 *
 * Escape closes, the backdrop closes, focus moves to the close button on open
 * and returns to the card on close, and the page behind cannot scroll while it
 * is open.
 */

export type Testimonial = {
  /** Stable key. */
  id: string;
  /** Vimeo id. Absent = the card stays an inert placeholder. */
  vimeoId?: string;
  /** Poster frame URL. Absent = the placeholder shows instead. */
  poster?: string;
  /** What belongs in this frame, for whoever supplies the footage. */
  ask: string;
};

/** Portrait: these are phone-recorded client videos. Change in ONE place if the
 *  delivered footage turns out to be landscape. */
const RATIO = "9/16";

export function VideoTestimonialCard({ vimeoId, poster, ask }: Omit<Testimonial, "id">) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const playable = Boolean(vimeoId);

  const close = useCallback(() => {
    setOpen(false);
    cardRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const stage = (
    <span className="sdp-vt-stage">
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="sdp-vt-poster" src={poster} alt="" width={720} height={1280} loading="lazy" decoding="async" />
      ) : (
        <MediaPlaceholder ratio={RATIO} tag="Video needed" label={ask} />
      )}
      <span className="sdp-vt-play" aria-hidden>
        <PlayGlyph size={22} />
      </span>
    </span>
  );

  if (!playable) {
    return <div className="sdp-vt-card is-inert">{stage}</div>;
  }

  return (
    <>
      <button
        type="button"
        ref={cardRef}
        className="sdp-vt-card"
        onClick={() => setOpen(true)}
        aria-label="Play this client's video testimonial"
      >
        {stage}
      </button>

      {open && (
        <div className="sdp-lb" role="dialog" aria-modal="true" aria-label="Video testimonial" onClick={close}>
          <div className="sdp-lb-frame" onClick={(e) => e.stopPropagation()}>
            <button type="button" ref={closeRef} className="sdp-lb-close" onClick={close} aria-label="Close video">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
            <div className="sdp-lb-ratio">
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                title="Client video testimonial"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VideoTestimonialCard;
