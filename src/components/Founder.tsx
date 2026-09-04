import { CheckGlyph, MediaPlaceholder, Section, SectionHeading, revealDelay } from "./sdp";

/**
 * BEAT 5a: FOUNDER AUTHORITY. The page's first DARK band.
 *
 * Shape: a CREDENTIAL SET. The meaning is not a bio (a bio is prose, and the
 * prose beat is the next section); it is a list of proofs. Category §12
 * Authority, component: the credential pill row beside the portrait, with the
 * four longer claims carried underneath as a hairline record ledger.
 *
 * WHY TWO TREATMENTS FOR ONE SET: the six credentials are labels (three to five
 * words each) and scan as chips. The four record items are sentences with
 * numbers inside them and cannot be chipped without truncating a claim, so they
 * keep their sentences and get ruled rows instead. Same category, two densities,
 * one beat.
 *
 * The ledger is deliberately NOT the card checklist used in beat 2: the same
 * component twice on one page would flatten both.
 *
 * BAND: dark. Per the skin's constant rhythm, dark lands on authority and risk
 * (this beat and the guarantee), which is what makes them read as the page's
 * two gravity moments.
 *
 * COPY: verbatim from the source md, in the source md's order, the two-line
 * descriptor, the name, the six credentials, the four record items. The ✔
 * character renders as the drawn check inside the accent disc (the skin bans
 * glyph characters in chrome); no word is changed.
 *
 * NO PHOTOGRAPHY EXISTS. The portrait is a 4:5 placeholder at the exact final
 * size, carrying the copy's own asset marker as its ask.
 *
 * Server component.
 */

const CREDENTIALS = [
  "10+ YEARS COACHING EXPERIENCE",
  "4X NATURAL BODYBUILDING PRO",
  "1000+ SUCCESS STORIES",
  "SPECIALIST IN NATURAL BODY RECOMPOSITION",
  "SELF-COACHED TO PRO STATUS",
  "COACHED ACROSS 7 COUNTRIES",
];

const RECORD = [
  "First Indian to earn Pro Cards across natural bodybuilding federations in India through a completely self-coached journey.",
  "Finished Top 20 amongst ~16,000–17,000 participants in the Fitter Transformation Challenge.",
  "Represented India internationally and placed 5th in the Fitness Model category.",
  "Has coached athletes to Gold, Silver & Bronze Medals, Pro Cards, Overall Titles, Champion Posing & Conditioning Awards.",
];

export function Founder() {
  return (
    <Section id="coach" band="dark">
      <div data-sdp-reveal>
        <SectionHeading
          title={
            <>
              The Coach Behind The
              <br className="sdp-br-lg" /> <em>Extreme Or Nothing Protocol</em>
            </>
          }
        />
      </div>

      <div className="sdp-founder-grid">
        <div className="sdp-founder-sticky" data-sdp-reveal style={revealDelay(".06s")}>
          <div className="sdp-founder-frame">
            <MediaPlaceholder
              ratio="4/5"
              tag="Photo needed"
              label="SANDESH’S SOLO PICTURE, vertical portrait crop, stage or gym lighting"
            />
          </div>
        </div>

        <div>
          <div data-sdp-reveal style={revealDelay(".1s")}>
            <h3 className="sdp-founder-name">SANDESH SOANS</h3>
            <div className="sdp-founder-rule" aria-hidden />
          </div>

          <div className="sdp-cred-pills" data-sdp-reveal style={revealDelay(".14s")}>
            {CREDENTIALS.map((c) => (
              <span className="sdp-cred-pill" key={c}>
                {c}
              </span>
            ))}
          </div>

          <ul className="sdp-record">
            {RECORD.map((item, i) => (
              <li key={item} data-sdp-reveal style={revealDelay(`${0.18 + i * 0.05}s`)}>
                <span className="ck" aria-hidden>
                  <CheckGlyph />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export default Founder;
