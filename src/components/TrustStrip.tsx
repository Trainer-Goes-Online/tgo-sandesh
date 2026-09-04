import { MediaPlaceholder, ShieldGlyph, StarGlyph } from "./sdp";

/**
 * BEAT 0b: trust row (page chrome, directly under the announcement bar).
 *
 * Copy, verbatim from the source md's second line:
 *   "[Photos] ★★★★★ 5.0 Review | 100% Money-Back Guarantee"
 *
 * The md marks the reviewer portraits as "[Photos]" and none have been
 * supplied, so each face is a 1:1 placeholder holding its exact final size:
 * when the crops land, the strip does not move. The stars are drawn glyphs,
 * not the copy's ★ characters, so they inherit the rating colour and stay
 * crisp at any weight.
 *
 * Server component. No client JS: this paints above the fold.
 */
const AVATAR_COUNT = 5;

function AvatarPlaceholder({ index }: { index: number }) {
  return (
    <MediaPlaceholder
      ratio="1/1"
      round
      compact
      tag="Photo needed"
      label={`Client face ${index + 1} of ${AVATAR_COUNT}, square 1:1 crop, ideally the same men who appear in the video testimonials`}
      style={{
        width: 32,
        height: 32,
        flex: "0 0 32px",
        marginLeft: index === 0 ? 0 : -6,
        borderStyle: "solid",
        borderColor: "var(--bg)",
        borderWidth: "1.5px",
        boxShadow: "0 0 0 1px rgba(var(--ink-rgb),.08)",
      }}
    />
  );
}

export function TrustStrip() {
  return (
    <div className="sdp-trust-strip">
      <div className="sdp-trust-avatars">
        {Array.from({ length: AVATAR_COUNT }, (_, i) => (
          <AvatarPlaceholder key={i} index={i} />
        ))}
      </div>

      <span className="sdp-trust-item">
        <span className="sdp-trust-stars" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <StarGlyph key={i} />
          ))}
        </span>
        <span>
          <b>5.0</b> Review
        </span>
      </span>

      <span className="sdp-trust-item">
        <span className="sdp-trust-check" aria-hidden>
          <ShieldGlyph size={18} />
        </span>
        <span>
          <b>100%</b> Money-Back Guarantee
        </span>
      </span>
    </div>
  );
}

export default TrustStrip;
