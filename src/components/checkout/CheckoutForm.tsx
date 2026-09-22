"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { COUNTRIES } from "@/lib/countries";
import { WHAT_THE_CALL_COVERS } from "@/lib/call-copy";
import { LEGAL, PRICE, inr } from "@/app/_legal/legal";
import { collectSignals } from "@/lib/client-signals";
import { bookingHref } from "@/lib/funnel";
import {
  trackAddToCart,
  trackBeginCheckout,
  trackInitiateCheckout,
} from "@/lib/track";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RZP_SDK = "https://checkout.razorpay.com/v1/checkout.js";

/* Loaded on demand rather than in the layout: it is roughly 100KB that only
   matters once someone actually presses pay. */
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RZP_SDK}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const el = document.createElement("script");
    el.src = RZP_SDK;
    el.async = true;
    el.onload = () => resolve(true);
    el.onerror = () => resolve(false);
    document.body.appendChild(el);
  });
}

/* The confirmation poll.

   The notice above the form promises the buyer this in so many words: pay,
   wait up to ten seconds without closing or refreshing the tab, and the
   calendar opens by itself. Razorpay's success `handler` covers the card and
   netbanking path. A UPI buyer approves inside their bank app, and that
   handler can be slow or can never fire at all if the sheet was dismissed on
   the way back, which would leave a buyer who has already been charged sitting
   on a checkout page.

   So two independent things watch for the payment and the first one to notice
   does the redirect: the handler, and this poll against the order's real
   status. At 2.5 seconds an interval, a captured payment is noticed well
   inside the ten seconds the copy promises.

   WHILE_OPEN is generous because a UPI collect request can sit in a bank app
   for minutes. AFTER_DISMISS is the grace window for someone who closed the
   sheet after paying: long enough to catch a late capture, short enough that a
   buyer who simply changed their mind is not stared at by a spinner. */
const POLL_INTERVAL_MS = 2500;
const POLL_BUDGET_WHILE_OPEN_MS = 5 * 60 * 1000;
const POLL_BUDGET_AFTER_DISMISS_MS = 90 * 1000;

/* The ✔️ becomes a drawn tick, per the skin's ban on emoji in chrome; the
   wording is untouched.

   MOVED TO @/lib/call-copy ON 2026-09-22. The booking page carried a hand-kept
   duplicate of this list and the thank-you page would have made a third, so
   the three surfaces now read one constant. */
const VALUE_BULLETS = WHAT_THE_CALL_COVERS;

const SAVING = PRICE.anchor - PRICE.amount;

function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

/**
 * Phone field: a native <select> for the dial code, then the number.
 *
 * Deliberately native rather than the custom searchable dropdown the SDP build
 * uses. A native select is one tap on a phone, gives the OS picker with its own
 * scrolling and type-ahead for free, needs no outside-click handling, and
 * cannot end up open behind another element. For twenty-five options, the
 * custom version is more machinery for a worse result.
 */
function PhoneField({
  value,
  onChange,
  code,
  onCode,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  /* The ISO-2 lives in the PARENT now, not here. Meta wants the COUNTRY as a
     hashed ISO 3166-1 alpha-2 code, and phone validation differs by country
     (India is exactly ten digits), so both the tracking call and the validator
     need the answer this select holds. The markup is untouched. */
  code: string;
  onCode: (v: string) => void;
  invalid: boolean;
}) {
  const selected = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

  return (
    <div className="checkout-phone-wrap" data-invalid={invalid || undefined}>
      <div className="country-select">
        <span className="country-select-value" aria-hidden>
          {selected.flag} {selected.dial}
        </span>
        <select
          value={code}
          onChange={(e) => onCode(e.target.value)}
          aria-label="Country dialling code"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name} ({c.dial})
            </option>
          ))}
        </select>
        <span className="country-select-chevron" aria-hidden>▾</span>
      </div>

      <input
        id="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={code === "IN" ? "98765 43210" : "Phone number"}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        aria-label="Phone number"
        aria-invalid={invalid || undefined}
      />
    </div>
  );
}

/** Order summary. Field-for-field the live SDP checkout's right-hand card. */
function OrderSummary() {
  return (
    <aside className="checkout-summary" aria-label="Order summary">
      <p className="checkout-summary-label">Order Summary</p>
      <h2 className="checkout-product-name">{LEGAL.product}</h2>
      <div className="checkout-event-pill">1:1 Consultation · With Sandesh</div>

      <div className="checkout-divider" />

      <div className="checkout-value-stack">
        {VALUE_BULLETS.map((item) => (
          <div key={item} className="checkout-value-item">
            <span className="checkout-check" aria-hidden>
              <Tick />
            </span>
            {item}
          </div>
        ))}
      </div>

      <div className="checkout-divider" />

      <div className="checkout-price-block">
        <div className="checkout-price-row">
          <span className="checkout-price-was">{inr(PRICE.anchor)}</span>
          <span className="checkout-price-now">{inr(PRICE.amount)}</span>
          <span className="checkout-save-badge">Save {inr(SAVING)}</span>
        </div>
        {/* NOT the SDP original's "100% Refundable · Zero Risk". On this funnel
            the ₹97 is a booking fee and the Refund Policy says it is
            non-refundable; the guarantee covers the programme. */}
        <p className="checkout-guarantee">
          ✦ One-time booking fee · The programme carries a 100% Money-Back Guarantee
        </p>
      </div>

      <div className="checkout-divider" />

      <div className="checkout-coaches">
        <div className="checkout-coach-avatars">
          <div className="checkout-coach-avatar">SS</div>
        </div>
        <div className="checkout-coach-names">
          <strong>Sandesh Soans</strong>
          10+ yrs coaching · 1000+ success stories · 7 countries
        </div>
      </div>
    </aside>
  );
}

function MobileSummary() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`checkout-summary-mobile${open ? " is-open" : ""}`}>
      <button type="button" className="checkout-summary-mobile-bar" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="checkout-summary-mobile-title">{LEGAL.product}</span>
        <span className="checkout-summary-mobile-trail">
          <span className="checkout-summary-mobile-price">{inr(PRICE.amount)}</span>
          <span className="chev" aria-hidden>▾</span>
        </span>
      </button>
      {open && (
        <div className="checkout-summary-expand-inner">
          <div className="checkout-event-pill">1:1 Consultation · With Sandesh</div>
          <div className="checkout-divider" />
          <div className="checkout-value-stack">
            {VALUE_BULLETS.map((item) => (
              <div key={item} className="checkout-value-item">
                <span className="checkout-check" aria-hidden><Tick /></span>
                {item}
              </div>
            ))}
          </div>
          <div className="checkout-divider" />
          <div className="checkout-price-row">
            <span className="checkout-price-was">{inr(PRICE.anchor)}</span>
            <span className="checkout-price-now">{inr(PRICE.amount)}</span>
            <span className="checkout-save-badge">Save {inr(SAVING)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

type Status = "idle" | "starting" | "sheet" | "confirming" | "redirecting";

export default function CheckoutForm() {
  const [f, setF] = useState<Record<string, string>>({});
  const [country, setCountry] = useState("IN"); // ISO-2, from the phone picker
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  /* ARRIVAL AT THE CHECKOUT. GA4 gets begin_checkout, Meta gets AddToCart.

     Meta's InitiateCheckout deliberately does NOT fire here. It waits until the
     details are valid and the payment sheet actually opens, which is a far
     stronger buying signal than a page load and is what the ads optimise on. A
     page-load InitiateCheckout teaches Meta to buy people who land rather than
     people who try to pay.

     This is also the ONLY Meta event a direct arrival ever gets: someone who
     opens /checkout from an email, a retargeting ad or a bookmark never touches
     the landing page, so without this they are invisible until the pay tap.
     Ref-guarded so React StrictMode's double effect and a remount cannot
     inflate the count. */
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    trackBeginCheckout();
    trackAddToCart();
  }, []);

  /* Poll bookkeeping. Refs, not state: these are read from inside timers and
     from Razorpay's callbacks, both of which close over whatever the value was
     when they were created. */
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollDeadline = useRef(0);
  const leaving = useRef(false);

  const stopPolling = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  };
  useEffect(() => stopPolling, []);

  /* Whoever notices the payment first wins, and only one of them navigates. */
  const goToBooking = (paymentId: string, orderId: string) => {
    if (leaving.current) return;
    leaving.current = true;
    stopPolling();
    setStatus("redirecting");
    window.location.assign(bookingHref(paymentId, orderId));
  };

  /* The return type is annotated because this arrow references ITSELF in its
     own initializer (the setTimeout at the bottom), which is the shape that
     makes TypeScript give up and infer `any`. */
  const pollOnce = async (orderId: string): Promise<void> => {
    if (leaving.current) return;
    if (Date.now() > pollDeadline.current) {
      stopPolling();
      /* The sheet is gone and nothing was captured inside the window. Never
         tell someone their payment failed: it may simply be slow, and the one
         thing that must not happen next is a second charge. */
      if (!leaving.current) {
        setStatus("idle");
        setError(
          `We have not received your payment yet. If money has already left your account, please do not pay again: email ${LEGAL.email} with your name and we will book your call.`,
        );
      }
      return;
    }
    try {
      const res = await fetch(
        `/api/razorpay/order-status?order_id=${encodeURIComponent(orderId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (data?.ok && data.paid) {
        goToBooking(String(data.paymentId ?? ""), orderId);
        return;
      }
    } catch {
      /* A dropped poll is not a failure. Try again on the next tick. */
    }
    pollTimer.current = setTimeout(() => void pollOnce(orderId), POLL_INTERVAL_MS);
  };

  const startPolling = (orderId: string, budgetMs: number) => {
    pollDeadline.current = Date.now() + budgetMs;
    stopPolling();
    pollTimer.current = setTimeout(() => void pollOnce(orderId), POLL_INTERVAL_MS);
  };

  const v = useMemo(() => {
    const digits = (f.phone ?? "").replace(/\D/g, "");
    return {
      firstName: (f.firstName ?? "").trim().length > 1,
      lastName: (f.lastName ?? "").trim().length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((f.email ?? "").trim()),
      city: (f.city ?? "").trim().length > 1,
      /* The dial code comes from the picker, so this validates the SUBSCRIBER
         number only: 7 to 12 digits covers every country in the list without
         pulling in libphonenumber-js. India is the strict case at exactly 10. */
      phone: country === "IN" ? digits.length === 10 : digits.length >= 7 && digits.length <= 12,
      ack,
    };
  }, [f, country, ack]);
  const valid = v.firstName && v.lastName && v.email && v.city && v.phone && v.ack;

  const dial = COUNTRIES.find((c) => c.code === country)?.dial ?? "+91";
  /* E.164 without the plus, which is what both Meta and Razorpay expect. */
  const e164 = `${dial}${f.phone ?? ""}`.replace(/\D/g, "");

  const busy = status !== "idle";

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (busy) return;
    if (!valid) {
      setError(
        v.ack
          ? "Please check the highlighted fields."
          : "Please confirm you will wait for the booking page to open.",
      );
      return;
    }
    setStatus("starting");

    const person = {
      email: (f.email ?? "").trim(),
      phone: e164,
      firstName: (f.firstName ?? "").trim(),
      lastName: (f.lastName ?? "").trim(),
      city: (f.city ?? "").trim(),
      country: country.toLowerCase(),
    };

    /* Meta InitiateCheckout + GA4 add_payment_info, fired BEFORE the sheet
       opens rather than after payment, because this is the moment intent is
       real: details are valid and the buyer is committing. */
    trackInitiateCheckout(person);

    try {
      const sdk = await loadRazorpay();
      if (!sdk) throw new Error("sdk");

      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        /* collectSignals carries the browser's _fbc / _fbp, its external id,
           the GA4 client id and the first-touch campaign. All of it is written
           into the Razorpay order's notes, because the webhook that fires
           Purchase sees only what Razorpay stored. */
        body: JSON.stringify({ ...person, ...collectSignals() }),
      });
      const order = await res.json();

      if (!res.ok || !order?.ok) {
        setStatus("idle");
        setError(
          order?.reason === "not-configured"
            ? "Payments are not switched on yet. Nothing has been charged."
            : "We could not start the payment. Please try again.",
        );
        return;
      }

      /* Read off window rather than asserted non-null: loadRazorpay resolving
         true and window.Razorpay existing are two different facts, and a `!`
         here would turn a failed SDK load into a TypeError inside a click. */
      const Rzp = window.Razorpay;
      if (!Rzp) throw new Error("sdk");

      const rzp = new Rzp({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: LEGAL.brand,
        description: LEGAL.product,
        prefill: {
          name: `${person.firstName} ${person.lastName}`.trim(),
          email: person.email,
          contact: e164,
        },
        /* Copper, matching --brand in globals.css. Razorpay renders its sheet
           in its own iframe, so it cannot read a CSS variable: this is the one
           place a hex has to be repeated, and it has to be changed with the
           token if the brand colour ever moves. */
        theme: { color: "#A75E3B" },
        modal: {
          ondismiss: () => {
            if (leaving.current) return;
            /* Do NOT stop polling. The buyer may have approved a UPI collect
               request and closed the sheet on the way back, in which case the
               payment is still landing. Keep watching for the grace window and
               say so, because the copy told them to wait. */
            setStatus("confirming");
            startPolling(order.orderId, POLL_BUDGET_AFTER_DISMISS_MS);
          },
        },
        /* PURCHASE IS NOT FIRED HERE. The signature-verified webhook owns it,
           so a UPI payer who finishes in their bank app and never returns is
           still counted. This handler only moves the buyer on. */
        handler: (r: { razorpay_payment_id?: string }) => {
          goToBooking(String(r?.razorpay_payment_id ?? ""), order.orderId);
        },
      });
      setStatus("sheet");
      startPolling(order.orderId, POLL_BUDGET_WHILE_OPEN_MS);
      rzp.open();
    } catch {
      setStatus("idle");
      setError("We could not start the payment. Please try again.");
    }
  };

  const showInvalid = (ok: boolean) => (touched && !ok ? true : undefined);

  return (
    <>
      <MobileSummary />

      <div className="checkout-main">
        <div className="checkout-form-panel">
          <div className="checkout-form-heading">
            <div className="checkout-section-label">Secure Checkout</div>
            <h1 className="checkout-form-title">Your Details</h1>
          </div>

          {/* Atul's copy, verbatim. It confirms the post-payment flow: payment
              succeeds, the tab stays open, the calendar opens by itself. */}
          <div className="checkout-notice">
            <span className="checkout-notice-icon" aria-hidden>!</span>
            <p>
              <strong>Important: please don’t close this page after paying.</strong> The moment your
              payment succeeds, <strong>wait up to 10 seconds</strong> without closing or refreshing
              this tab. You’ll then be taken automatically to the calendar to select your{" "}
              <strong>preferred date and time</strong> and book your call.{" "}
              <strong>Leaving early may stop your booking from being completed.</strong>
            </p>
          </div>

          <form noValidate onSubmit={startPayment}>
            <div className="checkout-fields">
              <div className="checkout-fields-row">
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="firstName">First Name <span>*</span></label>
                  <input id="firstName" type="text" autoComplete="given-name" placeholder="Arjun" value={f.firstName ?? ""} onChange={set("firstName")} aria-invalid={showInvalid(v.firstName)} />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="lastName">Last Name <span>*</span></label>
                  <input id="lastName" type="text" autoComplete="family-name" placeholder="Mehta" value={f.lastName ?? ""} onChange={set("lastName")} aria-invalid={showInvalid(v.lastName)} />
                </div>
              </div>

              <div className="checkout-field">
                <label className="checkout-label" htmlFor="email">Email Address <span>*</span></label>
                <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={f.email ?? ""} onChange={set("email")} aria-invalid={showInvalid(v.email)} />
              </div>

              <div className="checkout-field">
                <label className="checkout-label" htmlFor="city">City <span>*</span></label>
                <input id="city" type="text" autoComplete="address-level2" placeholder="Bengaluru" value={f.city ?? ""} onChange={set("city")} aria-invalid={showInvalid(v.city)} />
              </div>

              <div className="checkout-field">
                <label className="checkout-label" htmlFor="phone">Phone Number <span>*</span></label>
                <PhoneField
                  value={f.phone ?? ""}
                  onChange={(next) => setF((s) => ({ ...s, phone: next }))}
                  code={country}
                  onCode={setCountry}
                  invalid={showInvalid(v.phone) ?? false}
                />
              </div>
            </div>

            {/* Required, not decorative. It is the buyer agreeing in writing to
                the one behaviour the whole post-payment flow depends on, and an
                acknowledgement checkbox that gates nothing is dead UI. */}
            <label className="checkout-ack" data-invalid={showInvalid(v.ack)}>
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                aria-invalid={showInvalid(v.ack)}
              />
              <span>
                I understand that after payment I’ll wait up to 10 seconds for the booking page to
                open, then select my preferred date and time to book my call.
              </span>
            </label>

            <div className="checkout-submit-wrap">
              {/* The label never changes. Copy is the client's, and a button
                  that renames itself mid-payment reads as a different button.
                  State goes in the line underneath. */}
              <button
                type="submit"
                className="checkout-cta"
                disabled={busy}
                aria-busy={busy || undefined}
              >
                Pay {inr(PRICE.amount)} &amp; Book My Call
                <span className="cta-arrow" aria-hidden>→</span>
              </button>

              {/* One line under the CTA, and only ever one of the three. The
                  status text exists because the notice above promised the buyer
                  the page would keep them informed while it waits. */}
              {error ? (
                <p className="checkout-error" role="alert">{error}</p>
              ) : status === "starting" ? (
                <p className="checkout-status" role="status">Opening secure payment…</p>
              ) : status === "confirming" ? (
                <p className="checkout-status" role="status">
                  Confirming your payment. Please keep this page open.
                </p>
              ) : status === "redirecting" ? (
                <p className="checkout-status" role="status">
                  Payment received. Opening your calendar…
                </p>
              ) : null}

              <div className="checkout-trust">
                <span>256-bit SSL</span>
                <span className="checkout-trust-sep">·</span>
                <span>PCI Compliant</span>
                <span className="checkout-trust-sep">·</span>
                <span>Razorpay Verified</span>
              </div>
            </div>
          </form>
        </div>

        <OrderSummary />
      </div>
    </>
  );
}
