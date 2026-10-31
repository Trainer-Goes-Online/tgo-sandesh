"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowGlyph } from "@/components/sdp";
import { LEGAL, PRICE, inr } from "@/app/_legal/legal";
import { WHAT_THE_CALL_COVERS } from "@/lib/call-copy";
import { collectSignals } from "@/lib/client-signals";
import { COUNTRIES, DEFAULT_COUNTRY, countryByCode, isValidPhone, toE164 } from "@/lib/countries";
import { bookingHref } from "@/lib/funnel";
import { trackInitiateCheckout } from "@/lib/track";

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
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RZP_SDK}"]`);
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

   The notice above the form promises the buyer: pay, wait up to ten seconds
   without closing the tab, and the calendar opens by itself. Razorpay's
   success `handler` covers the card and netbanking path. A UPI buyer approves
   inside their bank app, and that handler can be slow or never fire at all if
   the sheet was dismissed on the way back, which would leave a buyer who has
   already been charged sitting on a checkout page. So the handler and this
   poll both watch for the payment, and the first one to notice redirects.

   WHILE_OPEN is generous because a UPI collect request can sit in a bank app
   for minutes. AFTER_DISMISS is the grace window for someone who closed the
   sheet after paying. */
const POLL_INTERVAL_MS = 2500;
const POLL_BUDGET_WHILE_OPEN_MS = 5 * 60 * 1000;
const POLL_BUDGET_AFTER_DISMISS_MS = 90 * 1000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

/**
 * Phone field: a native <select> for the dial code, then the number. Native
 * because it is one tap on a phone, gives the OS picker with its own type-ahead,
 * and cannot end up open behind another element.
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
  code: string;
  onCode: (v: string) => void;
  invalid: boolean;
}) {
  const selected = countryByCode(code);

  return (
    <div className="checkout-phone-wrap" data-invalid={invalid || undefined}>
      <div className="country-select">
        <span className="country-select-value" aria-hidden>
          {selected.code} {selected.dial}
        </span>
        <select value={code} onChange={(e) => onCode(e.target.value)} aria-label="Country dialling code">
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.dial})
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
        onChange={(e) => onChange(e.target.value.replace(/[^\d\s]/g, ""))}
        aria-label="Phone number"
        aria-invalid={invalid || undefined}
      />
    </div>
  );
}

function ValueStack() {
  return (
    <div className="checkout-value-stack">
      {WHAT_THE_CALL_COVERS.map((item) => (
        <div key={item} className="checkout-value-item">
          <span className="checkout-check" aria-hidden>
            <Tick />
          </span>
          {item}
        </div>
      ))}
    </div>
  );
}

/** Order summary, the right-hand card. */
function OrderSummary() {
  return (
    <aside className="checkout-summary" aria-label="Order summary">
      <p className="checkout-summary-label">Order Summary</p>
      <h2 className="checkout-product-name">{LEGAL.product}</h2>
      <div className="checkout-event-pill">1:1 Consultation · With Sandesh</div>

      <div className="checkout-divider" />
      <ValueStack />
      <div className="checkout-divider" />

      <div className="checkout-price-block">
        <div className="checkout-price-row">
          <span className="checkout-price-now">{inr(PRICE.amount)}</span>
        </div>
        {/* The fee is a booking fee and the Refund Policy says it is
            non-refundable; the guarantee covers the programme. Said here so
            the badge on the landing page is not read as covering the fee. */}
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
          <ValueStack />
          <div className="checkout-divider" />
          <div className="checkout-price-row">
            <span className="checkout-price-now">{inr(PRICE.amount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

type Status = "idle" | "starting" | "sheet" | "confirming" | "redirecting";

type RzpSuccess = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

export default function CheckoutForm() {
  const [f, setF] = useState<Record<string, string>>({});
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  /* Poll bookkeeping. Refs, not state: these are read from inside timers and
     from Razorpay's callbacks, both of which close over stale state. */
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

  const pollOnce = async (orderId: string): Promise<void> => {
    if (leaving.current) return;
    if (Date.now() > pollDeadline.current) {
      stopPolling();
      /* Never tell someone their payment failed: it may simply be slow, and
         the one thing that must not happen next is a second charge. */
      setStatus("idle");
      setError(
        `We have not received your payment yet. If money has already left your account, please do not pay again: email ${LEGAL.email} with your name and we will book your call.`,
      );
      return;
    }
    try {
      const res = await fetch(`/api/razorpay/order-status?order_id=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
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

  const v = useMemo(
    () => ({
      firstName: (f.firstName ?? "").trim().length > 0,
      lastName: (f.lastName ?? "").trim().length > 0,
      email: EMAIL.test((f.email ?? "").trim()),
      city: (f.city ?? "").trim().length > 1,
      phone: isValidPhone(country, f.phone ?? ""),
      ack,
    }),
    [f, country, ack],
  );
  const valid = v.firstName && v.lastName && v.email && v.city && v.phone && v.ack;

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

    /* E.164, no spaces: "+919075453949". The one format the webhook, Meta
       and Razorpay all accept as-is. */
    const phone = toE164(country, f.phone ?? "");
    const person = {
      email: (f.email ?? "").trim(),
      phone,
      firstName: (f.firstName ?? "").trim(),
      lastName: (f.lastName ?? "").trim(),
      city: (f.city ?? "").trim(),
      country,
    };

    /* Meta InitiateCheckout (pixel + CAPI, full user data) and GA4
       begin_checkout, fired the moment Pay is pressed with valid details. */
    const initiateCheckoutEventId = trackInitiateCheckout(person);

    try {
      const sdk = await loadRazorpay();
      if (!sdk) throw new Error("sdk");

      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        /* collectSignals carries _fbc / _fbp, the external id, the GA4 client
           id, the UTMs and the Meta ad params. create-order writes all of it
           into the order's notes, because the webhook that fires Purchase sees
           only what Razorpay stored. */
        body: JSON.stringify({
          ...collectSignals(),
          ...person,
          dialCode: countryByCode(country).dial,
          initiateCheckoutEventId,
        }),
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
          contact: phone,
        },
        /* --brand in globals.css. Razorpay renders its sheet in its own
           iframe, so it cannot read a CSS variable. */
        theme: { color: "#FF5E14" },
        modal: {
          ondismiss: () => {
            if (leaving.current) return;
            /* Do NOT stop polling: the buyer may have approved a UPI request
               and closed the sheet on the way back. */
            setStatus("confirming");
            startPolling(order.orderId, POLL_BUDGET_AFTER_DISMISS_MS);
          },
        },
        handler: (r: RzpSuccess) => {
          /* Purchase, server side, from THIS browser's request: the verify
             route checks Razorpay's signature and sends Meta's Purchase with
             the buyer's live IP and user agent. keepalive, so the navigation
             below cannot cancel it. The pixel copy fires on /book. */
          try {
            void fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(r),
              keepalive: true,
            });
          } catch {
            /* the webhook still sends Purchase */
          }
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

          {/* id is load-bearing: the mobile docked bar lives OUTSIDE this form
              and submits it by `form="checkout-form"`, so there is one payment
              path, not two. */}
          <form id="checkout-form" noValidate onSubmit={startPayment}>
            <div className="checkout-fields">
              <div className="checkout-fields-row">
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="firstName">First Name <span>*</span></label>
                  <input id="firstName" type="text" autoComplete="given-name" autoCapitalize="words" placeholder="Arjun" value={f.firstName ?? ""} onChange={set("firstName")} aria-invalid={showInvalid(v.firstName)} />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="lastName">Last Name <span>*</span></label>
                  <input id="lastName" type="text" autoComplete="family-name" autoCapitalize="words" placeholder="Shetty" value={f.lastName ?? ""} onChange={set("lastName")} aria-invalid={showInvalid(v.lastName)} />
                </div>
              </div>

              <div className="checkout-field">
                <label className="checkout-label" htmlFor="email">Email Address <span>*</span></label>
                <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="you@example.com" value={f.email ?? ""} onChange={set("email")} aria-invalid={showInvalid(v.email)} />
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

              <div className="checkout-field">
                <label className="checkout-label" htmlFor="city">City <span>*</span></label>
                <input id="city" type="text" autoComplete="address-level2" autoCapitalize="words" placeholder="Bengaluru" value={f.city ?? ""} onChange={set("city")} aria-invalid={showInvalid(v.city)} />
              </div>
            </div>

            {/* Required, not decorative: the buyer agreeing to the one
                behaviour the post-payment flow depends on. */}
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
              <button type="submit" className="checkout-cta" disabled={busy} aria-busy={busy || undefined}>
                Pay {inr(PRICE.amount)} &amp; Book My Call
                <span className="cta-arrow" aria-hidden><ArrowGlyph size={13} /></span>
              </button>

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

      {/* Mobile docked bar. It SUBMITS the form above, it does not link. On
          at 960px, where the sticky summary is hidden. */}
      <div className="checkout-stuck">
        <div className="checkout-stuck-inner">
          <span className="checkout-stuck-fig">
            <span className="checkout-stuck-cap">Total due today</span>
            <strong>{inr(PRICE.amount)}</strong>
          </span>
          <button
            type="submit"
            form="checkout-form"
            className="checkout-stuck-go"
            disabled={busy}
            aria-busy={busy || undefined}
          >
            <span>{busy ? "Opening payment" : "Pay & Book My Call"}</span>
            <span className="cta-arrow" aria-hidden><ArrowGlyph size={13} /></span>
          </button>
        </div>
      </div>
    </>
  );
}
