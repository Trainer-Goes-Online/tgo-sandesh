import { CheckGlyph, CtaLockup, revealDelay } from "./sdp";

export type ColophonLink = { label: string; href: string };

const ASSURANCES = ["Free 1:1 call", "Kannada or English", "Limited slots each week"];

export function Finale({ links = [] }: { links?: ColophonLink[] }) {
  return (
    <section id="finale" className="sdp-finale sdp-dark">
      <div className="sdp-finale-glow" aria-hidden />

      <div className="sdp-wrap sdp-finale-inner">
        <div className="sdp-finale-kn" lang="kn" data-sdp-reveal>
          ನಮ್ಮ ಊಟ, ನಮ್ಮ ರೀತಿ
        </div>

        <h2 className="sdp-h2 sdp-finale-h2" data-sdp-reveal style={revealDelay(".06s")}>
          Your Belly Didn’t Come In 90 Days.
          <br className="sdp-br-lg" /> <em>But It Can Go In 90.</em>
        </h2>

        <p className="sdp-sub sdp-finale-sub" data-sdp-reveal style={revealDelay(".1s")}>
          Book a free call with Sandesh. You’ll know what’s been holding you back and what your next
          90 days would look like. No pressure, and no pitch if it’s not right for you.
        </p>

        <div data-sdp-reveal style={revealDelay(".14s")}>
          <CtaLockup />
          <ul className="sdp-finale-checks">
            {ASSURANCES.map((a) => (
              <li key={a}>
                <CheckGlyph size={12} />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div className="sdp-colophon" data-sdp-reveal style={revealDelay(".18s")}>
          <div className="sdp-colophon-meta">© 2026 TRANSFORMMEBRO PVT LTD · Bengaluru</div>

          {links.length > 0 && (
            <nav className="sdp-colophon-links" aria-label="Legal">
              {links.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export default Finale;
