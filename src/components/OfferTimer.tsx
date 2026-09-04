"use client";

import { useEffect, useState } from "react";

/**
 * "OFFER ENDS IN :": the 5-hour countdown the source copy asks for, welded
 * into every CTA lockup (never a standalone strip).
 *
 * The deadline is stamped ONCE per visitor into localStorage, so a refresh or a
 * second tab continues the same countdown instead of restarting. A timer that
 * resets on every page load is the thing that reads as fake. At zero it stops
 * rendering rather than silently rolling into a fresh window.
 *
 * Renders nothing until mounted: localStorage is client-only and a
 * server-rendered digit would hydrate-mismatch on first paint.
 */

/** Window length in hours. Set to 0 to remove the countdown page-wide. */
export const OFFER_TIMER_HOURS = 5;

const KEY = "eon.offer.deadline";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function OfferTimer({ hours = OFFER_TIMER_HOURS }: { hours?: number }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (hours <= 0) return;
    const windowMs = hours * 3600_000;

    let deadline = Number(window.localStorage.getItem(KEY) || 0);
    // Re-stamp only if missing or absurd (clock change / tampered value).
    if (!deadline || deadline - Date.now() > windowMs) {
      deadline = Date.now() + windowMs;
      try {
        window.localStorage.setItem(KEY, String(deadline));
      } catch {
        /* private mode: the countdown simply restarts next visit */
      }
    }

    const tick = () => setLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [hours]);

  if (hours <= 0 || left === null || left <= 0) return null;

  const s = Math.floor(left / 1000);
  const cells = [
    { v: pad(Math.floor(s / 3600)), k: "Hrs" },
    { v: pad(Math.floor((s % 3600) / 60)), k: "Min" },
    { v: pad(s % 60), k: "Sec" },
  ];

  return (
    <div className="sdp-urgency" role="timer" aria-live="off">
      <span className="sdp-urgency-label">Offer ends in :</span>
      <span className="sdp-urgency-timer">
        {cells.map((c, i) => (
          <span key={c.k} style={{ display: "inline-flex" }}>
            <span className="sdp-urgency-unit">
              <b>{c.v}</b>
              <span>{c.k}</span>
            </span>
            {i < cells.length - 1 && <span className="sdp-urgency-sep" aria-hidden>:</span>}
          </span>
        ))}
      </span>
    </div>
  );
}
