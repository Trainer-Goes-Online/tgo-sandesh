import { PinGlyph, ShieldGlyph, StarGlyph } from "./sdp";

export function TrustStrip() {
  return (
    <div className="sdp-trust-strip">
      <span className="sdp-trust-item">
        <span className="sdp-trust-stars" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <StarGlyph key={i} />
          ))}
        </span>
        <span>
          <b>4.9</b> Client Rating
        </span>
      </span>

      <span className="sdp-trust-item">
        <span className="sdp-trust-check" aria-hidden>
          <ShieldGlyph size={18} />
        </span>
        <span>Results Or Coaching Continues At No Extra Cost</span>
      </span>

      <span className="sdp-trust-item">
        <span className="sdp-trust-pin" aria-hidden>
          <PinGlyph />
        </span>
        <span>Based In Bengaluru</span>
      </span>
    </div>
  );
}

export default TrustStrip;
