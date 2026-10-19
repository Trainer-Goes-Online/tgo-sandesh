"use client";

import { useEffect, useRef, useState } from "react";

import { LEGAL } from "@/app/_legal/legal";
import { WHAT_THE_CALL_COVERS } from "@/lib/call-copy";
import { trackSchedule } from "@/lib/track";

/**
 * THE BOOKING PAGE.
 *
 * Modelled on the live SDP funnel's book-a-call page
 * (SDP-New-Funnel/components/book-a-call/BookACallPage.tsx): announce strip,
 * hero, an embedded calendar with a loading state and an escape hatch, what
 * the call covers, who the visitor is about to talk to, a final nudge, a
 * docked bar. Only the theme differs.
 *
 * Meta's `Schedule` fires from Cal's `bookingSuccessful` callback, just before
 * the redirect to /thank-you. The CAPI fetch uses keepalive, so the navigation
 * does not cancel it.
 */

/* Verbatim from funnel-copy/01-landing-vsl.md, the source of truth. Nothing
   below is inferred, rounded or restated. */
const COACH_CREDS = [
  "First Indian to earn Pro Cards across natural bodybuilding federations in India through a completely self-coached journey.",
  "Finished Top 20 amongst ~16,000–17,000 participants in the Fitter Transformation Challenge.",
  "Represented India internationally and placed 5th in the Fitness Model category.",
  "Has coached athletes to Gold, Silver & Bronze Medals, Pro Cards, Overall Titles, Champion Posing & Conditioning Awards.",
];

const COACH_STATS = [
  { n: "10+ Yrs", l: "Coaching Experience" },
  { n: "1000+", l: "Success Stories" },
  { n: "4X", l: "Natural Bodybuilding Pro" },
  { n: "7", l: "Countries Coached" },
];

/* ---------------------------------------------------------------------
   Glyphs
   --------------------------------------------------------------------- */

function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

/* ---------------------------------------------------------------------
   The calendar
   --------------------------------------------------------------------- */

type Prefill = { name: string; email: string };

/** The spinner, and the escape hatch it turns into. Sits over the frame and
 *  disappears the moment the calendar is really there. */
function CalendarOverlay({ loaded, failed, href }: { loaded: boolean; failed: boolean; href: string }) {
  if (loaded) return null;
  return (
    <div className="book-cal-overlay">
      {failed ? (
        <p>
          The calendar did not load in this window.{" "}
          <a href={href} target="_blank" rel="noopener noreferrer">
            Open the booking page in a new tab →
          </a>
        </p>
      ) : (
        <>
          <span className="book-cal-spin" aria-hidden />
          <p>Loading available slots…</p>
        </>
      )}
    </div>
  );
}

/** What stands where the calendar was, once a slot is taken. Deliberately
 *  short and free of new promises: it states what the buyer just did, points
 *  at the confirmation Cal itself sends, and gives a human to contact. The
 *  detail of what the call covers is already on this page, below. */
function BookedPanel() {
  return (
    <div className="book-cal-standin">
      <div className="book-cal-placeholder">
        <div className="book-cal-placeholder-tag">Slot confirmed</div>
        <p className="book-cal-placeholder-lead">Your call is booked.</p>
        <p>
          The confirmation is on its way to the email address you gave the calendar, with the
          joining link and the option to reschedule.
        </p>
        <p className="book-cal-placeholder-help">
          Nothing arrived, or need to move it? Email{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> or call{" "}
          <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Cal.com, the real scheduler (supplied 2026-09-22)
   --------------------------------------------------------------------- */

/** From the client's own embed snippet. One event, so these are constants
 *  rather than env: there is nothing here that varies by environment. */
const CAL_LINK = "transformmebro/1-1-physique-transformation";
const CAL_ORIGIN = "https://app.cal.com";
/** cal.com namespaces per EVENT, so the namespace IS the slug. */
const CAL_NS = CAL_LINK.split("/")[1];
/** The public booking page, for the "did not load" escape hatch only. */
const CAL_URL = `https://cal.com/${CAL_LINK}`;

type CalQueue = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns?: Record<string, (...args: unknown[]) => void>;
  q?: unknown[][];
  config?: { forwardQueryParams?: boolean };
};

/** Cal's own loader, verbatim from the snippet apart from taking the script
 *  url as an argument. It defines window.Cal as a QUEUE immediately and
 *  appends the real script itself, so calls made before the script lands are
 *  replayed when it arrives. */
function loadCal(scriptSrc: string) {
  const C = window as unknown as { Cal?: CalQueue; document: Document };
  const A = scriptSrc;
  const L = "init";
  const p = (a: { q?: unknown[][] }, ar: unknown[]) => {
    (a.q = a.q || []).push(ar);
  };
  const d = C.document;
  C.Cal =
    C.Cal ||
    function (this: unknown, ...ar: unknown[]) {
      const cal = C.Cal as CalQueue;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        (d.head.appendChild(d.createElement("script")) as HTMLScriptElement).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function (...a: unknown[]) {
          p(api as unknown as { q?: unknown[][] }, a);
        } as unknown as ((...a: unknown[]) => void) & { q?: unknown[][] };
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === "string") {
          cal.ns![namespace] = cal.ns![namespace] || (api as (...a: unknown[]) => void);
          p(cal.ns![namespace] as unknown as { q?: unknown[][] }, ar);
          p(cal as unknown as { q?: unknown[][] }, ["initNamespace", namespace]);
        } else {
          p(cal as unknown as { q?: unknown[][] }, ar);
        }
        return;
      }
      p(cal as unknown as { q?: unknown[][] }, ar);
    };
  return C.Cal as CalQueue;
}

function CalEmbed({ prefill }: { prefill: Prefill }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  /* ── THE EMBED BOOTS ONCE, AND ONLY ONCE ────────────────────────────
     Cal's `inline` command MOUNTS an instance into the host element.
     Calling it twice does not refresh the first, it puts a SECOND instance
     in the same container, and the two then fight over what shows: one
     advances to the questions after a slot is tapped, the other re-renders
     the month view underneath. What the buyer sees is the form appear and
     snap straight back to slot selection, every time.

     reactStrictMode runs every effect, cleans it up and runs it again in
     development precisely to surface this. The ref survives that remount,
     so the second pass skips the boot. Learned on tgo-deepti, where it was
     a live bug. */
  const booted = useRef(false);

  useEffect(() => {
    /* The embed reports nothing on success or failure, so the only honest
       readiness signal is whether an iframe actually appeared. Polled, then
       given up on, rather than assumed. Same twelve-second ceiling as the
       paths this replaced. */
    const started = Date.now();
    const poll = window.setInterval(() => {
      if (document.querySelector("#eon-cal iframe")) {
        setLoaded(true);
        window.clearInterval(poll);
      } else if (Date.now() - started > 12000) {
        setFailed(true);
        window.clearInterval(poll);
      }
    }, 300);

    if (booted.current) return () => window.clearInterval(poll);
    booted.current = true;

    try {
      const Cal = loadCal(`${CAL_ORIGIN}/embed/embed.js`);
      Cal("init", CAL_NS, { origin: CAL_ORIGIN });

      /* From the supplied snippet: forwards the parent page's query string
         (UTMs included) into the embed. */
      Cal.config = Cal.config || {};
      Cal.config.forwardQueryParams = true;

      const ns = Cal.ns![CAL_NS];

      ns("inline", {
        elementOrSelector: "#eon-cal",
        config: {
          layout: "month_view",
          /* From the snippet: on a narrow screen Cal leads with the time
             list instead of the month grid, which is the right first thing
             to show when the grid would be unreadable. */
          useSlotsViewOnSmallScreen: "true",
          ...(prefill.name ? { name: prefill.name } : {}),
          ...(prefill.email ? { email: prefill.email } : {}),
        },
        calLink: CAL_LINK,
      });

      ns("ui", { hideEventTypeDetails: false, layout: "month_view" });

      /* ── THE REDIRECT (added here, not in the snippet) ───────────────
         Cal fires this when a booking completes inside the embed, and it is
         the only reliable in-page signal that the buyer actually picked a
         slot. Without it they sit on a confirmed calendar with nowhere to
         go, and the page cannot tell a booked buyer from an unbooked one.

         It goes to /thank-you, keeping the existing query string, with
         `booked=1` added. The `booked=1` fallback on THIS page is explained
         below.

         Belt and braces: a redirect can also be set on the event type in
         Cal's own dashboard. If one is ever set it WINS over this, so leave
         that field empty or point it at the same url. */
      ns("on", {
        action: "bookingSuccessful",
        callback: () => {
          trackSchedule();
          const q = new URLSearchParams(window.location.search);
          q.set("booked", "1");
          window.location.href = `/thank-you?${q.toString()}`;
        },
      });
    } catch {
      setFailed(true);
      window.clearInterval(poll);
    }

    return () => window.clearInterval(poll);
    /* Deliberately empty: the embed mounts once and reads nothing that
       changes. Re-running this is what mounts the second embed. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* `is-cal` opts out of the fixed --book-cal-h box the two iframe paths
       need. Cal measures its own content and sets the iframe height itself,
       so a fixed container is wrong in BOTH directions: the month view is
       shorter than 780px and leaves dead space, and the questions step is
       taller and gets clipped by the frame's overflow:hidden with nothing to
       scroll.

       `is-live` drops the min-height once the embed is really there. Until
       then the box has to hold its height or the loading overlay, which is
       inset:0, has nothing to sit in. */
    <div className="book-cal-frame">
      <div className={`book-cal-embed is-cal${loaded ? " is-live" : ""}`}>
        <div id="eon-cal" />
      </div>
      <CalendarOverlay loaded={loaded} failed={failed && !loaded} href={CAL_URL} />
    </div>
  );
}

function Calendar({ prefill }: { prefill: Prefill }) {
  return <CalEmbed prefill={prefill} />;
}

/* ---------------------------------------------------------------------
   Sections
   --------------------------------------------------------------------- */

function AnnounceStrip() {
  return (
    <div className="book-announce" role="region" aria-label="Booking status">
      <span className="book-announce-item">1:1 With Sandesh</span>
      <span className="book-announce-dot" aria-hidden />
      <span className="book-announce-item">10+ Years Coaching</span>
      <span className="book-announce-dot" aria-hidden />
      <span className="book-announce-item">1000+ Success Stories</span>
    </div>
  );
}

function goToCalendar(e: React.MouseEvent<HTMLAnchorElement>) {
  const dest = document.getElementById("calendar");
  if (!dest) return;
  e.preventDefault();
  window.scrollTo({
    top: dest.getBoundingClientRect().top + window.scrollY - 12,
    behavior: "smooth",
  });
}

function Hero() {
  return (
    <section className="book-hero" id="book-top">
      <div className="book-wrap">
        <h1>
          One Last Step. <em>Pick Your Slot.</em>
        </h1>
        <p className="book-hero-sub">
          Choose the date and time for your <strong>{LEGAL.product}</strong> below.
        </p>
      </div>
    </section>
  );
}

function CalendarSection({ prefill, booked }: { prefill: Prefill; booked: boolean }) {
  return (
    <section className="book-section book-light-alt" id="calendar">
      <div className="book-wrap">
        <div className="book-head">
          <div className="book-eyebrow">{booked ? "YOU ARE BOOKED" : "CHOOSE YOUR TIME"}</div>
          <h2 className="book-h2">
            {booked ? (
              <>
                Your Slot Is <em>Confirmed.</em>
              </>
            ) : (
              <>
                Pick A Slot That <em>Works For You.</em>
              </>
            )}
          </h2>
        </div>

        {/* A GUARD NOW, NOT THE HAPPY PATH. Cal's booking redirect goes to
            /thank-you, so almost nobody sees this. It stays for the buyer who
            gets back HERE after booking, by the back button, their own
            history, or a redirect configured on the Cal event type that
            overrides ours. Handing that person the picker again is how a
            call gets booked twice, and they cannot tell from a calendar
            whether the first one worked. */}
        {booked ? <BookedPanel /> : <Calendar prefill={prefill} />}
      </div>
    </section>
  );
}

function IncludedSection() {
  return (
    <section className="book-section book-light">
      <div className="book-wrap">
        <div className="book-head">
          <div className="book-eyebrow">WHAT YOUR BOOKING COVERS</div>
          <h2 className="book-h2">
            On The Call, You Get <em>Three Things.</em>
          </h2>
        </div>

        <div className="book-cards">
          {WHAT_THE_CALL_COVERS.map((item, i) => (
            <div key={item} className="book-card">
              <span className="book-card-n">{String(i + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoachSection() {
  return (
    <section className="book-section book-dark">
      <div className="book-wrap">
        <div className="book-coach">
          <div className="book-eyebrow is-dark">WHO YOU ARE TALKING TO</div>
          <h2 className="book-h2 is-dark">Sandesh Soans</h2>
          <p className="book-coach-role">
            4X Natural Bodybuilding Pro · Specialist In Natural Body Recomposition
          </p>

          <ul className="book-coach-creds">
            {COACH_CREDS.map((c) => (
              <li key={c}>
                <span className="book-coach-tick" aria-hidden><Tick /></span>
                {c}
              </li>
            ))}
          </ul>

          <div className="book-stat-row">
            {COACH_STATS.map((s) => (
              <div key={s.l} className="book-stat">
                <div className="book-stat-n">{s.n}</div>
                <div className="book-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="book-section book-dark-alt" id="book-final">
      <div className="book-wrap book-narrow">
        <h2 className="book-final-h">
          The Hard Part Is Done. <em>Now Pick A Time.</em>
        </h2>
        <p className="book-final-sub">
          Nothing else stands between today and a real conversation about your physique.
        </p>
        <a className="book-btn book-btn-lg" href="#calendar" onClick={goToCalendar}>
          Pick My Slot
          <span className="book-btn-arrow" aria-hidden><Arrow /></span>
        </a>

        <p className="book-support">
          Questions before your call?{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          {" · "}
          <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>
        </p>
      </div>
    </section>
  );
}

/** Docked bar. Chrome, not content: it appears once the hero is gone and hides
 *  again at the final CTA, because the page's own button is right there and two
 *  buttons competing at the close is how this component turns into clutter.
 *  Because it hides, it needs no spacer in normal flow. */
function StickyBar() {
  const [pastHero, setPastHero] = useState(false);
  const [atFinal, setAtFinal] = useState(false);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observers: IntersectionObserver[] = [];

    const hero = document.getElementById("book-top");
    if (hero) {
      const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { threshold: 0 });
      io.observe(hero);
      observers.push(io);
    }
    const final = document.getElementById("book-final");
    if (final) {
      const io = new IntersectionObserver(([e]) => setAtFinal(e.isIntersecting), { threshold: 0 });
      io.observe(final);
      observers.push(io);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const on = pastHero && !atFinal;

  return (
    /* Off-screen it is inert and aria-hidden, so it is never a phantom tab stop
       or a second reading of the instruction for a screen reader. */
    <div className={`book-stuck${on ? " is-on" : ""}`} inert={!on} aria-hidden={!on}>
      <div className="book-stuck-inner">
        <div className="book-stuck-text">
          <span className="book-stuck-pulse" aria-hidden />
          <span>
            <strong>One last step:</strong> pick your slot
          </span>
        </div>
        <a className="book-btn" href="#calendar" onClick={goToCalendar}>
          Pick My Slot
          <span className="book-btn-arrow" aria-hidden><Arrow /></span>
        </a>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Page
   --------------------------------------------------------------------- */

export default function BookingPage({
  prefill,
  booked = false,
}: {
  prefill: Prefill;
  /** `?booked=1`, set by the redirect Cal fires on a completed booking. */
  booked?: boolean;
}) {
  return (
    <>
      <AnnounceStrip />
      <Hero />
      <CalendarSection prefill={prefill} booked={booked} />
      <IncludedSection />
      <CoachSection />
      <FinalCTA />
      <StickyBar />
    </>
  );
}
