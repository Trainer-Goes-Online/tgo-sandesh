"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LEGAL, PRICE, inr } from "@/app/_legal/legal";
/* `import type`, and it has to stay that way. order-status.ts imports
   checkout-config.ts, which reads RAZORPAY_KEY_SECRET. A type-only import is
   erased before bundling so nothing from that module reaches the browser; a
   value import from it would drag a module that mentions the secret into the
   client graph. */
import type { BookingState } from "@/app/book/order-status";
import { WHAT_THE_CALL_COVERS } from "@/lib/call-copy";
import { trackPurchase } from "@/lib/track";

/**
 * THE BOOKING PAGE, everything below the payment check.
 *
 * Modelled on the live SDP funnel's book-a-call page
 * (SDP-New-Funnel/components/book-a-call/BookACallPage.tsx): confirmation
 * strip, hero with a two-step indicator, an embedded calendar with a loading
 * state and an escape hatch, what the fee covers, who the buyer is about to
 * talk to, a final nudge, a docked bar. Only the theme differs.
 *
 * TRACKING, and the whole of it:
 *   - GA4 `purchase`, once, keyed on the payment id.  Fired here.
 *   - Meta `Purchase`.                                NOT fired here, ever.
 *
 * Meta's Purchase belongs to the signature-verified Razorpay webhook and to
 * nothing else, because a UPI buyer finishes inside their bank app and often
 * never reaches this page at all. Firing it here as well would double-count
 * every buyer who does arrive, and firing it INSTEAD would lose most Indian
 * sales. GA4's copy is safe to fire here because it is keyed on the payment id
 * and the webhook's server-side copy carries the same key, so GA4 collapses
 * the pair.
 *
 * There is deliberately NO event when a slot is actually picked. The calendar
 * lives in a third-party iframe, and the only honest signal it offers is a
 * postMessage from the vendor's own origin. Adding one would mean inventing an
 * event name, and this project's rule is standard events only, declared in a
 * closed union, so a new name has to be a review rather than a line of code.
 */

/* ---------------------------------------------------------------------
   The calendar destination.

   ⚠️ NOT SUPPLIED. Sandesh's scheduling link does not exist anywhere in this
   repo or in the source copy, and it is not something that can be guessed:
   the wrong link books a stranger's calendar. So it is an env var, and when it
   is unset this page renders a labelled stand-in exactly where the slot picker
   will go, rather than an empty box or a dead iframe.

   Works with whatever the team already uses. A calendly.com link gets
   Calendly's own inline widget, which sizes itself and supports prefill;
   anything else (Cal.com, Zoho Bookings, GoHighLevel, a Google Appointment
   schedule) is embedded as a plain iframe. Both get the same shell, the same
   loading state and the same "open in a new tab" fallback.
   --------------------------------------------------------------------- */
const CALENDAR_URL = (process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL || "").trim();

const CALENDLY_WIDGET_SRC = "https://assets.calendly.com/assets/external/widget.js";
const CALENDLY_WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";
/* Calendly's own chrome removed, and the widget tinted to this skin: copper
   accent, charcoal text, ivory ground. */
const CALENDLY_QUERY =
  "hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=A75E3B&text_color=151515&background_color=F4F0E8";

function isCalendly(url: string): boolean {
  try {
    return /(^|\.)calendly\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------------
   Copy sources, all named so nothing here is mistaken for invented.
   --------------------------------------------------------------------- */

/* ⚠️ VERBATIM from the checkout's own order summary (VALUE_BULLETS in
   src/components/checkout/CheckoutForm.tsx). This page repeats what the buyer
   was promised at the moment they paid, so the two lists must say the same
   thing. They are duplicated rather than imported because importing them would
   pull the whole checkout form module into this page's bundle. EDIT BOTH.

   These three lines were written during the build, not supplied by Sandesh.
   They still need his sign-off: they are this page's only description of what
   the call actually contains.

   MOVED TO @/lib/call-copy ON 2026-09-22. They were a second literal here,
   kept in step with the checkout's copy by hand; the thank-you page would
   have made a third. That module imports nothing, so reading it does not drag
   the checkout's Razorpay config into this bundle, which was the reason for
   the duplicate in the first place. */

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

/** Calendly's inline widget: its own script, its own sizing, its own prefill. */
function CalendlyEmbed({ url, prefill }: { url: string; prefill: Prefill }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState(url);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const parts = [CALENDLY_QUERY];
    if (prefill.name) parts.push(`name=${encodeURIComponent(prefill.name)}`);
    if (prefill.email) parts.push(`email=${encodeURIComponent(prefill.email)}`);
    /* The supplied link may already carry its own query string. */
    const full = `${url}${url.includes("?") ? "&" : "?"}${parts.join("&")}`;

    setTarget(full);
    host.setAttribute("data-url", full);

    if (!document.querySelector(`link[href="${CALENDLY_WIDGET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CALENDLY_WIDGET_CSS;
      document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${CALENDLY_WIDGET_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = CALENDLY_WIDGET_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    /* The widget replaces the host's contents with an iframe when it
       initialises. There is no load callback to hook, so watch for the iframe
       and give up after twelve seconds into the fallback link, rather than
       leaving a paid buyer looking at a spinner forever. */
    let tries = 0;
    const poll = window.setInterval(() => {
      if (host.querySelector("iframe")) {
        setLoaded(true);
        window.clearInterval(poll);
      } else if (++tries > 60) {
        setFailed(true);
        window.clearInterval(poll);
      }
    }, 200);

    return () => window.clearInterval(poll);
  }, [url, prefill.name, prefill.email]);

  return (
    <div className="book-cal-frame">
      <div className="book-cal-embed">
        <div
          ref={hostRef}
          className="calendly-inline-widget"
          style={{ minWidth: 300, width: "100%", height: "100%" }}
        />
      </div>
      <CalendarOverlay loaded={loaded} failed={failed} href={target} />
    </div>
  );
}

/** Everything that is not Calendly: a plain iframe, which every scheduling
 *  tool worth using supports. */
function GenericEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    /* Same twelve-second ceiling as the Calendly path. An iframe that is
       blocked by the vendor's frame-ancestors policy fires neither load nor
       error in some browsers, so a timer is the only reliable escape. */
    const t = window.setTimeout(() => setFailed(true), 12000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="book-cal-frame">
      <div className="book-cal-embed">
        <iframe src={url} title="Booking calendar" onLoad={() => setLoaded(true)} />
      </div>
      <CalendarOverlay loaded={loaded} failed={failed && !loaded} href={url} />
    </div>
  );
}

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

/** ⚠️ Stands in for the slot picker until the scheduling link is supplied.
 *  Deliberately loud, at the exact height the real calendar will occupy, so
 *  nothing on the page moves when it lands. It also gives a buyer who reaches
 *  it something to do, because this frame can be live-facing. */
function CalendarPlaceholder() {
  return (
    <div className="book-cal-standin">
      <div className="book-cal-placeholder">
        <div className="book-cal-placeholder-tag">Calendar not connected</div>
        <p className="book-cal-placeholder-lead">
          The slot picker goes here.
        </p>
        <p>
          Set <code>NEXT_PUBLIC_BOOKING_CALENDAR_URL</code> in <code>.env.local</code> to Sandesh’s
          scheduling link. A Calendly link is embedded with Calendly’s own widget; any other
          scheduler is embedded as an iframe.
        </p>
        <p className="book-cal-placeholder-help">
          If you are seeing this after paying, nothing is lost. Email{" "}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> or call{" "}
          <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a> with your name and we will book your
          call.
        </p>
      </div>
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
         into the embed, which carries ?o= and ?p= across the seam. */
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
          /* INERT TODAY. bookingHref() carries only the two ids, so neither
             key is ever present. Wired anyway, because the moment the
             checkout forwards a name and an email the calendar prefills with
             no further change here, and a buyer typing details in twice is
             the commonest reason a paid slot never gets booked. */
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

         It goes to /thank-you, the sixth surface, added 2026-09-22. For the
         few hours in between it returned to THIS page with `booked=1`,
         because the build had no thank-you route at all; that fallback is
         still wired below and is explained there.

         Keeping the existing query string preserves `o` and `p`, so the
         payment ids travel with the buyer and `booked=1` rides along with
         them. /thank-you does not re-check the payment: by this point
         Razorpay has confirmed it once on /book and Cal has confirmed the
         booking, and a confirmation page that can fail its own check is a
         worse outcome than one that simply confirms.

         Belt and braces: a redirect can also be set on the event type in
         Cal's own dashboard. If one is ever set it WINS over this, so leave
         that field empty or point it at the same url. */
      ns("on", {
        action: "bookingSuccessful",
        callback: () => {
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

/* CALENDAR_URL stays the escape hatch, not the default. The scheduler is
   Cal.com now and is wired above; the env var is only consulted if someone
   points this build at a different tool, and the placeholder is unreachable
   while CAL_LINK is set. */
function Calendar({ prefill }: { prefill: Prefill }) {
  if (CALENDAR_URL) {
    if (isCalendly(CALENDAR_URL)) return <CalendlyEmbed url={CALENDAR_URL} prefill={prefill} />;
    return <GenericEmbed url={CALENDAR_URL} />;
  }
  if (CAL_LINK) return <CalEmbed prefill={prefill} />;
  return <CalendarPlaceholder />;
}

/* ---------------------------------------------------------------------
   Sections
   --------------------------------------------------------------------- */

function AnnounceStrip({ confirmed }: { confirmed: boolean }) {
  return (
    <div className="book-announce" role="region" aria-label="Booking status">
      {confirmed && (
        <>
          <span className="book-announce-item is-good">
            <Tick />
            Payment Confirmed
          </span>
          <span className="book-announce-dot" aria-hidden />
        </>
      )}
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

/**
 * Three states, three different things to say, and the difference between the
 * last two is the whole point of checking with Razorpay at all:
 *
 *   paid        we know the money is captured
 *   unconfirmed we could not find out (no ids on the link, or our own lookup
 *               failed). They still get a calendar: a real buyer whose query
 *               string was stripped on the way back from a bank app must never
 *               be stranded by our own uncertainty
 *   unpaid      Razorpay knows this order and says it is NOT paid. The only
 *               state where the calendar is withheld
 */
function Hero({ state }: { state: BookingState }) {
  const paid = state.status === "paid";
  const unpaid = state.status === "unpaid";

  return (
    <section className="book-hero" id="book-top">
      <div className="book-wrap">
        {paid && (
          <div className="book-badge">
            <span className="book-badge-tick" aria-hidden><Tick /></span>
            Payment Confirmed
          </div>
        )}

        {unpaid ? (
          <h1>
            One Step Missing. <em>Your Payment.</em>
          </h1>
        ) : (
          <h1>
            One Last Step. <em>Pick Your Slot.</em>
          </h1>
        )}

        {paid ? (
          <p className="book-hero-sub">
            Your <strong>{inr(PRICE.amount)}</strong> booking fee is paid. Choose the date and time
            for your <strong>{LEGAL.product}</strong> below.
          </p>
        ) : unpaid ? (
          <p className="book-hero-sub">
            We have not received a payment against this booking link yet, so there is no slot to
            hold. The details are just below.
          </p>
        ) : (
          <p className="book-hero-sub">
            We could not confirm a payment from this link, which usually just means the
            confirmation details did not carry across.{" "}
            <strong>If you have already paid, pick your slot below.</strong> If you have not paid
            yet, <Link href="/checkout">start here</Link>.
          </p>
        )}

        <div className="book-steps">
          <div className={`book-step${paid ? " is-done" : unpaid ? " is-active" : ""}`}>
            <span className="book-step-circ">{paid ? <Tick /> : "1"}</span>
            <span className="book-step-lbl">Paid</span>
          </div>
          <span className="book-step-line" aria-hidden />
          <div className={`book-step${unpaid ? "" : " is-active"}`}>
            <span className="book-step-circ">2</span>
            <span className="book-step-lbl">Pick Slot</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The one state where the calendar is withheld: Razorpay knows this order and
 *  says it has not been paid. Never phrased as a failure, and it never invites
 *  a second payment for an order that might simply be slow: the wording is the
 *  checkout's own, for the same situation. */
function NotPaid() {
  return (
    <section className="book-section book-light" id="calendar">
      <div className="book-wrap book-narrow">
        <div className="book-blocked">
          <h2>We Have Not Received Your Payment Yet</h2>
          <p>
            This booking link points at an order that has not been paid, so there is no slot to
            hold yet.
          </p>
          <p>
            <strong>
              If money has already left your account, please do not pay again: email{" "}
              <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> with your name and we will book
              your call.
            </strong>
          </p>
          <Link className="book-btn" href="/checkout">
            Go Back To Checkout
            <span className="book-btn-arrow" aria-hidden><Arrow /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CalendarSection({
  state,
  prefill,
  booked,
}: {
  state: BookingState;
  prefill: Prefill;
  booked: boolean;
}) {
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
            overrides ours. Handing that person the picker again is how a paid
            call gets booked twice, and they cannot tell from a calendar
            whether the first one worked. */}
        {booked ? <BookedPanel /> : <Calendar prefill={prefill} />}

        {state.status === "paid" && (
          <div className="book-cal-reassure">
            <Tick />
            Your {inr(PRICE.amount)} is paid. There is nothing more to pay to attend this call.
          </div>
        )}
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

function FinalCTA({ blocked }: { blocked: boolean }) {
  return (
    <section className="book-section book-dark-alt" id="book-final">
      <div className="book-wrap book-narrow">
        {!blocked && (
          <>
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
          </>
        )}

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
  state,
  prefill,
  booked = false,
}: {
  state: BookingState;
  prefill: Prefill;
  /** `?booked=1`, set by the redirect Cal fires on a completed booking. */
  booked?: boolean;
}) {
  /* GA4's browser-side purchase. Ref-guarded on top of the durable key inside
     trackPurchase(), so StrictMode's double effect never reaches storage
     twice. */
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    if (state.status !== "paid") return;
    /* No payment id, no event. transaction_id is what GA4 dedupes on and what
       lets this event collapse into the webhook's server-side copy of the same
       sale; sending an empty one would key every such visit to the same row
       and count one sale for all of them. The webhook still reports the sale,
       so nothing is lost but the browser-side duplicate. */
    if (!state.paymentId) return;
    fired.current = true;
    trackPurchase(state.paymentId);
  }, [state]);

  const blocked = state.status === "unpaid";

  return (
    <>
      <AnnounceStrip confirmed={state.status === "paid"} />
      <Hero state={state} />
      {blocked ? <NotPaid /> : <CalendarSection state={state} prefill={prefill} booked={booked} />}
      {!blocked && <IncludedSection />}
      <CoachSection />
      <FinalCTA blocked={blocked} />
      {!blocked && <StickyBar />}
    </>
  );
}
