import type { Metadata } from "next";

import SiteFooter from "@/components/SiteFooter";
import { LEGAL } from "@/app/_legal/legal";
import { WHAT_THE_CALL_COVERS } from "@/lib/call-copy";

export const metadata: Metadata = {
  title: "You Are Booked · Extreme or Nothing",
  description: "Your 1:1 Physique Transformation Strategy Call is confirmed.",
  /* Never indexable, for the same reason as /book: it is a post-payment page
     and a search result for it would send strangers into a confirmation for a
     call they have not booked. */
  robots: { index: false, follow: false },
};

/**
 * THE CONFIRMATION · /thank-you
 *
 * ── WHERE IT SITS ──────────────────────────────────────────────────────
 *   /checkout -> PAYMENT -> /book -> BOOKING -> /thank-you
 *
 * ── WHY THIS PAGE EXISTS (2026-09-22, Atul) ────────────────────────────
 * It did not, until now. SHAPE's VSL blueprint defines FIVE surfaces, and
 * that entry was reverse-engineered from this very build on 2026-09-04, so
 * this funnel ended at the booking page and Cal's completed booking had
 * nowhere to send anyone. tgo-deepti later added a sixth surface and that
 * is now the house standard; the blueprint has been updated to match.
 *
 * ── WHAT IT IS FOR, AND WHAT IT IS NOT ─────────────────────────────────
 * By the time anyone lands here they have paid AND booked, so the only thing
 * left to influence is whether they turn up prepared. Every push to book is
 * gone: on a page reached only by booking, a "book your slot" button is a
 * bug.
 *
 * IT FIRES NOTHING. GA4's purchase is already sent from /book, keyed on the
 * payment id, and Meta's Purchase belongs to the signature-verified Razorpay
 * webhook and to nothing else. A second copy of either here would double
 * count every buyer who reaches this page and under-count every UPI buyer who
 * does not. tgo-deepti's thank-you fires nothing for the same reason.
 *
 * There is still no event for the booking itself. `Schedule` is a standard
 * Meta event and Cal's embed now reports a completed booking, so it is
 * finally possible, but it is not in this build's allow-list
 * (src/app/api/meta/event/route.ts) and widening that list is a review, not a
 * line of code: the list is what stops a stranger forging a conversion.
 *
 * ── COPY ───────────────────────────────────────────────────────────────
 * Modelled beat for beat on tgo-deepti's /thank-you, which Atul named as the
 * standard: confirmation seal, "what this call actually is", "what to have
 * ready", and a close that is contact details rather than a pitch.
 *
 * `WHAT_THE_CALL_COVERS` is the SAME constant the checkout and the booking
 * page read, so all three surfaces describe the call identically. It still
 * needs Sandesh's sign-off: see the note in src/lib/call-copy.ts.
 *
 * ⚠️ THE PREP LIST IS MINE, not Sandesh's. It follows from what the call
 * covers (current physique, training, nutrition) and asks for nothing a
 * client would not already have, but it is instructions given to someone who
 * has paid, so it should be confirmed rather than assumed.
 *
 * A Server Component: nothing here is interactive.
 */

type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] ?? "" : v ?? "").trim();

/* What to have ready. Two halves each: the thing, then why it earns its place
   in the call. */
const HAVE_READY: [string, string][] = [
  [
    "Recent photos",
    "Front, side and back, in the same light. They say more about where you actually are than a number does.",
  ],
  [
    "Your current weight",
    "Plus any measurements you already track. If you track nothing, that is an answer too.",
  ],
  [
    "Your real training week",
    "What you actually did the last seven days, not the week you meant to have.",
  ],
  [
    "A normal day of eating",
    "An ordinary day, not a good one. The ordinary day is the one worth fixing.",
  ],
];

function Seal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9.2" />
      <polyline points="7.6 12.4 10.6 15.4 16.4 8.8" />
    </svg>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  /* `booked=1` is set by the Cal handoff on /book. Its absence is NOT treated
     as an error: somebody may arrive from their own history or from a redirect
     configured on the Cal event type, and a confirmation page that accuses a
     real buyer of not having booked is worse than one that simply confirms. */
  void first(sp.booked);

  return (
    <div className="eon-book eon-ty">
      {/* ── 1 · CONFIRMATION. Dark band, the page's first peak. ─────── */}
      <section className="book-section book-dark ty-hero">
        <div className="book-wrap book-narrow">
          <span className="ty-seal" aria-hidden>
            <Seal />
          </span>
          <span className="ty-badge">Booking confirmed</span>
          <h1 className="ty-h1">
            Your call is <em>locked in.</em>
          </h1>
          <p className="ty-sub">
            Your slot is confirmed and the details are on their way to the email address you booked
            with. Put it in your calendar now, while it is in front of you.
          </p>

          <ul className="ty-chips">
            <li>
              <span className="ty-tick" aria-hidden>
                <Tick />
              </span>
              Confirmation by email, with your joining link
            </li>
            <li>
              <span className="ty-tick" aria-hidden>
                <Tick />
              </span>
              A reminder before the call
            </li>
          </ul>
        </div>
      </section>

      {/* ── 2 · WHAT THE CALL IS. Light band, display ordinals. ─────── */}
      <section className="book-section book-light">
        <div className="book-wrap">
          <div className="book-head">
            <div className="book-eyebrow">WHAT THIS CALL ACTUALLY IS</div>
            <h2 className="book-h2">
              This is not a <em>sales call.</em>
            </h2>
          </div>

          <ol className="ty-ord-grid">
            {WHAT_THE_CALL_COVERS.map((line, i) => (
              <li key={line}>
                <span className="ty-ord">{String(i + 1).padStart(2, "0")}</span>
                <p>{line}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 3 · PREP. Light-alt band. ──────────────────────────────── */}
      <section className="book-section book-light-alt">
        <div className="book-wrap">
          <div className="book-head">
            <div className="book-eyebrow">BEFORE THE CALL</div>
            <h2 className="book-h2">
              What to have <em>ready.</em>
            </h2>
          </div>

          <ul className="ty-ready">
            {HAVE_READY.map(([t, b]) => (
              <li key={t}>
                <h3>{t}</h3>
                <p>{b}</p>
              </li>
            ))}
          </ul>

          <p className="ty-note">
            Come with what is true for you today, not what you wish were true. The honest version is
            the one that can actually be worked from.
          </p>
        </div>
      </section>

      {/* ── 4 · CLOSE. Dark band. Contact, not a pitch. ────────────── */}
      <section className="book-section book-dark ty-close">
        <div className="book-wrap book-narrow">
          <h2 className="book-h2">
            See you on the <em>call.</em>
          </h2>
          <p className="ty-sub">
            Something come up, or the confirmation not arrived? Write to{" "}
            <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> or call{" "}
            <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
