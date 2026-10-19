"use client";

import { useEffect, useState } from "react";
import { PlayGlyph } from "./sdp";

export type WatchItem = { label: string; vimeoId?: string };

export function WatchCards({ items }: { items: WatchItem[] }) {
  const [playing, setPlaying] = useState<WatchItem | null>(null);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPlaying(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [playing]);

  return (
    <>
      <div className="sdp-watch-grid">
        {items.map((item) => (
          <button
            type="button"
            className="sdp-watch-card"
            key={item.label}
            disabled={!item.vimeoId}
            onClick={() => setPlaying(item)}
          >
            <span className="sdp-watch-play" aria-hidden>
              <PlayGlyph size={16} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {playing?.vimeoId && (
        <div className="sdp-lb" role="dialog" aria-modal="true" aria-label={playing.label} onClick={() => setPlaying(null)}>
          <div className="sdp-lb-frame" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="sdp-lb-close" aria-label="Close video" onClick={() => setPlaying(null)}>
              ✕
            </button>
            <div className="sdp-lb-ratio">
              <iframe
                src={`https://player.vimeo.com/video/${playing.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                title={playing.label}
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

export default WatchCards;
