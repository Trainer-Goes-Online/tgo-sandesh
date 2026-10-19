import { CtaLockup, Section, SectionHeading, revealDelay } from "./sdp";

const INCLUSIONS: { title: string; body: string }[] = [
  {
    title: "A Full Body Check On Day 1",
    body: "Body fat, muscle, waist, strength and photos, so we know exactly where you’re starting and what to fix first.",
  },
  {
    title: "Training That Fits Your Work Hours",
    body: "4 sessions a week, about 45 minutes, gym or home. If you travel, the plan travels with you.",
  },
  {
    title: "A Food Plan From Your Own Kitchen",
    body: "Rice, ragi, dosa and whatever’s cooked at home. No separate cooking, no boiled-chicken diet.",
  },
  {
    title: "Weekly Check-Ins With Sandesh",
    body: "Every week we review your progress and change what isn’t working. You’re never guessing.",
  },
  {
    title: "Form Checks On Video",
    body: "Send a clip, get corrections, so every workout counts and you don’t get hurt.",
  },
  {
    title: "A Finish Line, And A Plan After It",
    body: "A 90-day target agreed on Day 1, then a simple routine to keep the belly off.",
  },
];

export function Included() {
  return (
    <Section id="whats-included" band="light">
      <div data-sdp-reveal>
        <SectionHeading
          eyebrow="INSIDE YOUR 90 DAYS"
          title={
            <>
              Everything You <em>Get</em>
            </>
          }
        />
      </div>

      <div className="sdp-get-grid">
        {INCLUSIONS.map((item, i) => (
          <article
            className="sdp-card sdp-get-card"
            key={item.title}
            data-sdp-reveal
            style={revealDelay(`${0.06 + i * 0.05}s`)}
          >
            <span className="sdp-get-num" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="sdp-get-title">{item.title}</h3>
              <p className="sdp-get-body">{item.body}</p>
            </div>
          </article>
        ))}
      </div>

      <div data-sdp-reveal style={revealDelay(".1s")}>
        <CtaLockup />
      </div>
    </Section>
  );
}

export default Included;
