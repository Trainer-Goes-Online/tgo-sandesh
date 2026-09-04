"use client";

import { useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { MediaPlaceholder, PlayGlyph } from "./sdp";

/**
 * BEAT 1 (focal media), the hero VSL frame.
 *
 * Anatomy is the skin's: an accent-lit frame around a 16:9 stage, poster
 * covered by a dimming wash, one lit play disc with a ripple ping. Clicking
 * swaps the poster for the player and the decorative overlay yields to the
 * native controls.
 *
 * NOTHING IS FAKED WHILE THE FILM IS MISSING. No video and no poster have been
 * delivered, so the stage holds a labelled 16:9 placeholder and the disc is
 * inert and aria-hidden: there is no click target that does nothing. Supply
 * `vimeoId` (and ideally `poster`) and the same component becomes the real
 * player with no layout change, because the frame already occupies the exact
 * final space.
 */
export function VSLFrame({
  vimeoId,
  poster,
}: {
  vimeoId?: string;
  poster?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const hasVideo = Boolean(vimeoId);

  return (
    <div className="sdp-video-frame">
      <div
        id="sdp-vsl"
        className={`sdp-video${hasVideo ? " has-video" : ""}${playing ? " playing" : ""}`}
        {...(hasVideo && !playing
          ? {
              role: "button" as const,
              tabIndex: 0,
              "aria-label": "Play the video",
              onClick: () => setPlaying(true),
              onKeyDown: (e: ReactKeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPlaying(true);
                }
              },
            }
          : {})}
      >
        {playing && vimeoId && (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
            title="Extreme or Nothing Protocol"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}

        {!playing &&
          (poster ? (
            <div className="sdp-video-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster} alt="" width={1280} height={720} fetchPriority="high" decoding="async" />
            </div>
          ) : (
            <MediaPlaceholder
              ratio="16/9"
              tag="VSL pending"
              label="The sales video itself, plus a poster frame of Sandesh on camera (1920x1080)"
              /* label parked at the bottom of the stage so the play disc,
                 which sits dead-centre, never covers the ask */
              style={{
                position: "absolute",
                inset: 0,
                height: "100%",
                borderRadius: 14,
                border: 0,
                alignItems: "end",
                paddingBottom: 18,
              }}
            />
          ))}

        {!playing &&
          (hasVideo ? (
            <span className="sdp-play">
              <PlayGlyph />
            </span>
          ) : (
            <span className="sdp-play" aria-hidden style={{ opacity: 0.55, cursor: "default" }}>
              <PlayGlyph />
            </span>
          ))}
      </div>
    </div>
  );
}
