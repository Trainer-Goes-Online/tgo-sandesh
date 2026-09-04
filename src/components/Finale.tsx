import { CtaLockup, revealDelay } from "./sdp";

/**
 * BEAT 11: THE FINALE. The page's closing peak and its last dark band.
 *
 * Formatted lean, exactly as the blueprint locks it (tgo-sreshtha's shape):
 * eyebrow → identity headline → CTA lockup → centred colophon. No dense body
 * paragraphs, no second argument, no standalone footer, the colophon folds in
 * here.
 *
 * What makes it the premium beat is DEPTH, not more content: the Welds
 * "closing-stage background depth": mesh blooms over a floor ramp, a faint
 * edge-masked dot grid drifting slowly, a lit top seam marking the stage
 * boundary, and a centred fading hairline above the colophon. All background;
 * it adds nothing to read and it stops entirely under reduced motion.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COPY FLAG: THE HEADLINE IS A REPRISE, NOT NEW COPY, AND IT AWAITS A CALL.
 * The source md ends at the FAQ: it carries no finale copy at all. Rather than
 * write a closing line (that would be invention, on the single most important
 * beat on the page), this reprises the guarantee's own headline verbatim, 
 * "You Bring The Commitment. We’ll Guarantee The Transformation.", which is
 * the strongest identity line the client has already written, and it lands
 * correctly here because the reader has now read the terms it refers to.
 * Swap it for a purpose-written closing line whenever Atul has one.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The colophon's legal links are OFF by default. Those routes belong to the
 * checkout build, not to the landing page, and shipping anchors to pages that
 * do not exist yet would be worse than shipping none. Pass `links` once they
 * are live: <Finale links={[{ label: "Privacy Policy", href: "/privacy" }, …]} />
 *
 * Server component (the countdown inside the lockup is the only client piece).
 */

export type ColophonLink = { label: string; href: string };

export function Finale({ links = [] }: { links?: ColophonLink[] }) {
  return (
    <section id="finale" className="sdp-finale sdp-dark">
      <div className="sdp-finale-glow" aria-hidden />

      <div className="sdp-wrap sdp-finale-inner">
        <div className="sdp-eyebrow center" data-sdp-reveal>
          EXTREME OR NOTHING PROTOCOL
        </div>

        <h2 className="sdp-h2 sdp-finale-h2" data-sdp-reveal style={revealDelay(".06s")}>
          You Bring The Commitment.
          <br className="sdp-br-lg" /> <em>We’ll Guarantee The Transformation.</em>
        </h2>

        <div data-sdp-reveal style={revealDelay(".12s")}>
          <CtaLockup />
        </div>

        <div className="sdp-colophon" data-sdp-reveal style={revealDelay(".18s")}>
          <div className="sdp-colophon-name">
            <span>Sandesh Soans</span>
            <span className="sdp-colophon-star" aria-hidden>
              ✦
            </span>
            <span>Extreme or Nothing Protocol</span>
          </div>

          {links.length > 0 && (
            <nav className="sdp-colophon-links" aria-label="Legal">
              {links.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          <div className="sdp-colophon-meta">© 2026 Sandesh Soans. All rights reserved.</div>
        </div>
      </div>
    </section>
  );
}

export default Finale;
