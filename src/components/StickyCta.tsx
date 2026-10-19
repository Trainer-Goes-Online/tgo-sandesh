import { ArrowGlyph, BOOKING_HREF } from "./sdp";

const LABEL = "Book My Free Call";
const NOTE = "Free 1:1 Call With Sandesh";
const TITLE = "The NAMMA Method";

/* Always visible; the page reserves its height via --stuck-h on .sdp-root. */
export function StickyCta() {
  return (
    <div className="sdp-stuck on">
      <div className="sdp-wrap sdp-stuck-inner">
        <div className="sdp-stuck-meta">
          <span className="sdp-stuck-title">{TITLE}</span>
          <span className="sdp-stuck-note">
            <span className="sdp-stuck-dot" aria-hidden />
            {NOTE}
          </span>
        </div>

        <a className="sdp-stuck-btn" href={BOOKING_HREF} data-qualify>
          <span>{LABEL}</span>
          <span className="arrow" aria-hidden>
            <ArrowGlyph />
          </span>
        </a>
      </div>
    </div>
  );
}

export default StickyCta;
