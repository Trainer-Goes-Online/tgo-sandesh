import type { CSSProperties, ReactNode } from "react";

/**
 * RAIL: the shared marquee track used by every horizontal proof row on the
 * page (beat 3 creators, beat 4a before/after, beat 4b video testimonials).
 *
 * WHY ONE COMPONENT: the source copy prints a movement cue under each row
 * ("To move from right to left", "To move from left to right"), so all three
 * rows carry the same structure and must behave identically. One component,
 * one direction prop.
 *
 * HOW THE LOOP IS SEAMLESS: the track holds the item list an EVEN number of
 * times and slides by exactly -50%, so the second half arrives where the first
 * half started. The base skin puts the gap on the track, which makes the halves
 * unequal by one gap and produces a small jump at the seam; here each copy is
 * its own flex GROUP carrying the gap plus one trailing gap, so the halves are
 * exactly equal and the seam is invisible.
 *
 * `repeat` exists because a short set cannot fill a wide screen: six 226px
 * cards are 1.3k of a 1.9k viewport, and the loop would show a bald patch. Two
 * copies per half fixes it. Every copy after the first is `inert` +
 * `aria-hidden`: they exist only to fill the loop, so they must never be read
 * by a screen reader or reachable by Tab (they hold real Instagram links).
 *
 * The rail is also natively scrollable (`is-scrollable`). That is not decoration:
 * with `overflow:hidden` alone, anyone with reduced motion (animation stopped)
 * could never reach the items past the fold. It also makes the copy's own cue
 * literally true: you can move it.
 */

type Direction = "left" | "right";

export function Rail({
  direction = "left",
  repeat = 1,
  seconds = 60,
  label,
  children,
}: {
  /** "left" = content travels right-to-left (default). "right" = the reverse. */
  direction?: Direction;
  /** Copies of the set per half. Raise it when the set is too short to fill a
   *  wide screen (6 cards or fewer: use 2). */
  repeat?: number;
  /** One loop, in seconds. Set it per rail so every rail on the page travels at
   *  roughly the same ~40px/s: a longer track needs a longer loop, or the wide
   *  rows visibly race the short ones. */
  seconds?: number;
  label: string;
  children: ReactNode;
}) {
  const copies = Math.max(1, Math.round(repeat)) * 2;

  return (
    <div className="sdp-rail is-scrollable sdp-rail-bleed" role="group" aria-label={label}>
      <div
        className={`sdp-rail-track is-grouped${direction === "right" ? " reverse" : ""}`}
        style={{ ["--rail-dur"]: `${seconds}s` } as CSSProperties}
      >
        {Array.from({ length: copies }, (_, i) =>
          i === 0 ? (
            <div className="sdp-rail-group" key={i}>
              {children}
            </div>
          ) : (
            <div className="sdp-rail-group" key={i} aria-hidden inert>
              {children}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default Rail;
