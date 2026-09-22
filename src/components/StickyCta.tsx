import { ArrowGlyph, CHECKOUT_URL } from "./sdp";

/**
 * BEAT 12: THE STICKY CTA. Page chrome, not a section (so it is not gated).
 *
 * The skin's sweeping dark-glass bar: fixed to the bottom, blurred graphite
 * glass, a 1px accent seam sweeping across the top, sliding up from below.
 *
 * WHEN IT SHOWS: always. Atul's call. It previously appeared past the hero and
 * hid over the finale, so that two CTAs never competed at the close; it is now
 * unconditional, so the offer is one tap away wherever the reader stops.
 * Because it no longer hides, the page must RESERVE its height: `--stuck-h` is
 * padded onto .sdp-root, or the bar sits on top of the finale's own CTA.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COPY FLAG: THE LABEL IS TRIMMED, AND THE TRIM IS A CHOICE TO APPROVE.
 * The page's CTA sentence is "CLICK HERE TO GET YOUR PERSONALISED DIAGNOSIS &
 * TRANSFORMATION ROADMAP →". At bar height that wraps to three lines on a
 * phone, so this uses a shortened form built only from the source's own words:
 *
 *      GET YOUR DIAGNOSIS & ROADMAP
 *
 * Nothing new is claimed; "Click here to", "Personalised" and
 * "Transformation" are dropped for width. Change LABEL below for a
 * different trim. The price came off 2026-09-22 (Atul: remove it from the
 * CTA everywhere); it still shows in the hero stat band and at checkout.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Fail-safe: there is nothing to fail. It is a link and a heading, rendered on
 * the server, with no state and no observer. (Previously
 * content, so nothing is lost). While it is off-screen it is `inert` and
 * aria-hidden, so it is never a phantom tab stop or a duplicate reading of the
 * offer.
 *
 * Client component.
 */

const LABEL = "Get Your Diagnosis & Roadmap";
const NOTE = "100% MONEY-BACK GUARANTEE";
const TITLE = "Extreme or Nothing Protocol";

/**
 * The docked CTA. Present on every scroll position, by Atul's call.
 *
 * It used to appear only past the hero and hide again over the finale, to avoid
 * sitting under a CTA that was already on screen. It is now unconditional, so
 * the offer is one tap away wherever the reader stops. The page reserves room
 * for it (`--stuck-h` on .sdp-root), which the conditional version did not need
 * because it hid before the last section arrived.
 *
 * No IntersectionObserver, no state, and nothing to hydrate: it renders the
 * same on the server and the client.
 */
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

        <a className="sdp-stuck-btn" href={CHECKOUT_URL}>
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
