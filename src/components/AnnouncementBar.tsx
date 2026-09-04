/**
 * BEAT 0a: announcement strip (page chrome, above everything).
 *
 * Copy, verbatim from the source md's first line:
 *   "10+ Years of Coaching Experience | 1000+ Success Stories"
 *
 * Rendered as the accent bar with a live pulsing dot. Two short credential
 * items, so this is the STATIC banner form of the strip rather than the
 * scrolling marquee: a marquee exists to cycle copy that cannot fit, and this
 * fits. (Same call the live SDP funnel made on its own two-item strip.)
 *
 * The figures sit in a dark chip. On a light accent, bold text on the bar has
 * almost no contrast and reads as blended, so the number gets a surface of its
 * own and the label stays in solid ink.
 *
 * Server component, no client JS: the bar is static and above the fold.
 */
const ITEMS = [
  { num: "10+ Years", label: "of Coaching Experience" },
  { num: "1000+", label: "Success Stories" },
];

export function AnnouncementBar() {
  return (
    <div className="sdp-announce" role="note">
      <span className="sdp-announce-dot" aria-hidden />
      {ITEMS.map((it, i) => (
        <span className="sdp-announce-item" key={it.num}>
          {i > 0 && (
            <span className="sdp-announce-sep" aria-hidden>
              |
            </span>
          )}
          <b className="sdp-announce-num">{it.num}</b>
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

export default AnnouncementBar;
