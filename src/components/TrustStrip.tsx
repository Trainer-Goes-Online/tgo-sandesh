import { ShieldGlyph, StarGlyph } from "./sdp";

/**
 * BEAT 0b: trust row (page chrome, directly under the announcement bar).
 *
 * Copy, verbatim from the source md's second line:
 *   "[Photos] ★★★★★ 5.0 Review | 100% Money-Back Guarantee"
 *
 * The faces are the first five creators from CreatorRails, in that component's
 * order, served from the same /public/creators files. The stars are drawn
 * glyphs, not the copy's ★ characters, so they inherit the rating colour and
 * stay crisp at any weight.
 *
 * Server component. No client JS: this paints above the fold.
 */
/* Same handles and same order as CreatorRails, so the strip and the rail below
   never show a different set of people. */
const AVATAR_HANDLES = [
  "prathap.kannadigaa",
  "biharibeast_27",
  "bhaskar_b_g_",
  "prakash.patel.__",
  "__sravan.__",
] as const;

function Avatar({ handle, index }: { handle: string; index: number }) {
  return (
    <img
      className="sdp-trust-avatar"
      src={`/creators/${handle}.jpg`}
      alt=""
      aria-hidden
      width={32}
      height={32}
      loading="eager"
      decoding="async"
      style={{ marginLeft: index === 0 ? 0 : -6, zIndex: AVATAR_HANDLES.length - index }}
    />
  );
}

export function TrustStrip() {
  return (
    <div className="sdp-trust-strip">
      <div className="sdp-trust-avatars">
        {AVATAR_HANDLES.map((handle, i) => (
          <Avatar key={handle} handle={handle} index={i} />
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
