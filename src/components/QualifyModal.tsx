"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_COUNTRY, countryByCode, isValidPhone, toE164 } from "@/lib/countries";
import { BOOKING_HREF } from "@/lib/funnel";
import { sendLeadToPabbly, trackAddToCart, trackLead } from "@/lib/track";
import PhoneField from "./PhoneField";
import { ArrowGlyph, CheckGlyph } from "./sdp";

type Choice = { kind: "choice"; key: string; q: string; options: string[]; other?: string };
type Scale = { kind: "scale"; key: string; q: string; min: string; max: string };
/** The last step: name, email and phone together (was two single-field steps
 *  until 2026-10-26). */
type Contact = { kind: "contact"; key: "contact"; q: string };
type Question = Choice | Scale | Contact;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const OTHER = "Other";
/** Q3's last option: the one answer that does NOT make a QualifiedLead. */
const NOT_READY = "I’m really interested, but not ready to invest in my health right now";

const QUESTIONS: Question[] = [
  {
    kind: "choice",
    key: "physique",
    q: "What best describes your current physique and fitness situation?",
    options: [
      "I train consistently, but my physique has plateaued.",
      "I’ve built some muscle, but I’m carrying more body fat than I want.",
      "I’m relatively lean, but I want significantly more muscle and definition",
      "I’ve made progress before, but I struggle to maintain momentum and consistency.",
      "I’m getting back into serious training after some time away.",
      OTHER,
    ],
    other: "Tell us in a few words",
  },
  {
    kind: "scale",
    key: "seriousness",
    q: "On a scale of 1–10, how serious are you about solving this now?",
    min: "Just exploring",
    max: "Ready to fix this now",
  },
  {
    kind: "choice",
    key: "investment",
    q: "If I show you a clear, personalised plan to transform your physique over the next 90–120 days, with the training, nutrition and accountability needed to remove the guesswork, what would you be willing to invest in achieving that transformation?",
    options: [
      "₹6,000 per month (Structured Coaching & Guidance)",
      "₹8,000 per month (Personalised Transformation Coaching)",
      "₹12,000 per month (Premium 1:1 Transformation Coaching)",
      NOT_READY,
    ],
  },
  {
    kind: "choice",
    key: "decision",
    q: "How will the decision to start be made?",
    options: [
      "I am the sole decision maker and can go ahead on my own",
      "Someone else would need to pay for this, and I have not spoken to them about it yet",
    ],
  },
  {
    kind: "contact",
    key: "contact",
    q: "Where should we send your call details?",
  },
];

/** Every CTA carrying `data-qualify` opens this instead of navigating. Without
 *  JS the link still goes straight to the booking page. */
export default function QualifyModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [city, setCity] = useState("");
  /* Errors show only after a submit attempt or once a field is left, never
     while someone is still typing their first characters. */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const trigger = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const advance = useRef<number | undefined>(undefined);

  const close = useCallback(() => {
    window.clearTimeout(advance.current);
    setOpen(false);
    trigger.current?.focus();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest<HTMLElement>("a[data-qualify]");
      if (!a) return;
      e.preventDefault();
      trigger.current = a;
      setStep(0);
      setOpen(true);
      trackAddToCart();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  /* Each step starts at the top with focus on the question, not on the first
     option: a focused option draws a ring that reads as pre-selected. Text
     steps focus their input so the keyboard opens. */
  useEffect(() => {
    if (!open) return;
    body.current?.scrollTo({ top: 0 });
    const target =
      panel.current?.querySelector<HTMLElement>("input[data-autofocus]") ??
      panel.current?.querySelector<HTMLElement>("#sdp-qm-q");
    target?.focus({ preventScroll: true });
  }, [open, step]);

  useEffect(() => () => window.clearTimeout(advance.current), []);

  if (!open) return null;

  const q = QUESTIONS[step];
  const picked = answers[q.key] ?? "";
  const needsOther = q.kind === "choice" && picked === OTHER;
  const valid = {
    name: name.trim().length > 0,
    email: EMAIL.test(email.trim()),
    phone: isValidPhone(country, phone),
    city: city.trim().length >= 2,
  };
  const ready =
    q.kind === "contact"
      ? valid.name && valid.email && valid.phone && valid.city
      : Boolean(picked) && (!needsOther || otherText.trim().length > 0);
  const last = step === QUESTIONS.length - 1;
  const showError = (f: keyof typeof valid) => touched[f] && !valid[f];
  const touch = (f: string) => setTouched((t) => ({ ...t, [f]: true }));

  const pick = (value: string) => setAnswers((s) => ({ ...s, [q.key]: value }));

  /* A tapped answer moves on by itself after a beat, long enough to see it
     selected. "Other" waits, because it still needs typing. */
  const choose = (value: string) => {
    pick(value);
    window.clearTimeout(advance.current);
    if (value === OTHER) return;
    advance.current = window.setTimeout(
      () => setStep((s) => Math.min(s + 1, QUESTIONS.length - 1)),
      320,
    );
  };

  const back = () => {
    window.clearTimeout(advance.current);
    setStep(step - 1);
  };

  const next = () => {
    if (!ready) {
      /* The button is disabled until the step is complete, but Enter in a
         field still lands here: show what is missing rather than nothing. */
      if (q.kind === "contact") setTouched({ name: true, email: true, phone: true, city: true });
      return;
    }
    if (!last) {
      setStep(step + 1);
      return;
    }
    const qualified = answers.investment !== NOT_READY;
    /* E.164, no spaces: "+919075453949". The one format the webhook, Meta
       and every SMS / WhatsApp tool accept as-is. */
    const phoneE164 = toE164(country, phone);
    /* keepalive fetches inside, so the navigation below does not cancel them. */
    trackLead(name, email, qualified, phoneE164, country, city.trim());

    /* Cal attaches `metadata[...]` query params to the booking it creates; the
       embed forwards this page's query string into the calendar. Name and
       email are Cal's own booking fields: passed bare, they prefill the
       calendar instead of riding along as metadata. */
    const params = new URLSearchParams(window.location.search);
    params.set("name", name.trim());
    params.set("email", email.trim());
    params.set("metadata[phone]", phoneE164);
    params.set("metadata[city]", city.trim());
    for (const item of QUESTIONS) {
      if (item.kind === "contact") continue;
      const value = answers[item.key] === OTHER ? `Other: ${otherText.trim()}` : answers[item.key];
      params.set(`metadata[${item.key}]`, value);
    }
    const bookingPath = `${BOOKING_HREF}?${params.toString()}`;

    sendLeadToPabbly({
      name: name.trim(),
      email: email.trim(),
      phone: phoneE164,
      countryCode: country,
      dialCode: countryByCode(country).dial,
      city: city.trim(),
      physique: answers.physique === OTHER ? `Other: ${otherText.trim()}` : answers.physique,
      seriousness: answers.seriousness,
      investment: answers.investment,
      decision: answers.decision,
      qualified,
      bookingPath,
    });

    window.location.href = bookingPath;
  };

  return (
    <div className="sdp-qm" role="dialog" aria-modal="true" aria-labelledby="sdp-qm-q" onClick={close}>
      <div className="sdp-qm-panel" ref={panel} onClick={(e) => e.stopPropagation()}>
        <div className="sdp-qm-head">
          <div className="sdp-qm-head-row">
            <span className="sdp-qm-step">
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <button type="button" className="sdp-qm-close" aria-label="Close" onClick={close}>
              ✕
            </button>
          </div>
          <div className="sdp-qm-bar" aria-hidden>
            <span style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
        </div>

        <div className="sdp-qm-body" ref={body}>
          <p className="sdp-qm-q" id="sdp-qm-q" tabIndex={-1}>
            {q.q}
          </p>

          {q.kind === "choice" ? (
            <div className="sdp-qm-options" role="radiogroup" aria-labelledby="sdp-qm-q">
              {q.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={picked === o}
                  className={`sdp-qm-option${picked === o ? " is-on" : ""}`}
                  onClick={() => choose(o)}
                >
                  <span className="sdp-qm-dot" aria-hidden>
                    {picked === o && <CheckGlyph size={11} />}
                  </span>
                  <span>{o}</span>
                </button>
              ))}
              {needsOther && (
                <input
                  className="sdp-qm-input"
                  type="text"
                  enterKeyHint="next"
                  placeholder={q.other}
                  aria-label={q.other}
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  autoFocus
                />
              )}
            </div>
          ) : q.kind === "scale" ? (
            <div className="sdp-qm-scale">
              <div className="sdp-qm-scale-ends">
                <span>
                  <b>1</b> = {q.min}
                </span>
                <span>
                  <b>10</b> = {q.max}
                </span>
              </div>
              <div className="sdp-qm-scale-row" role="radiogroup" aria-labelledby="sdp-qm-q">
                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={picked === n}
                    className={`sdp-qm-num${picked === n ? " is-on" : ""}`}
                    onClick={() => choose(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="sdp-qm-fields">
              <div className="sdp-qm-field">
                <label className="sdp-qm-label" htmlFor="sdp-qm-name">Name</label>
                <input
                  id="sdp-qm-name"
                  className={`sdp-qm-input${showError("name") ? " is-invalid" : ""}`}
                  type="text"
                  enterKeyHint="next"
                  autoComplete="name"
                  autoCapitalize="words"
                  placeholder="Your full name"
                  aria-invalid={showError("name") || undefined}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => touch("name")}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  data-autofocus=""
                />
                {showError("name") && <p className="sdp-qm-error">Please enter your name.</p>}
              </div>

              <div className="sdp-qm-field">
                <label className="sdp-qm-label" htmlFor="sdp-qm-email">Email</label>
                <input
                  id="sdp-qm-email"
                  className={`sdp-qm-input${showError("email") ? " is-invalid" : ""}`}
                  type="email"
                  inputMode="email"
                  enterKeyHint="next"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  aria-invalid={showError("email") || undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touch("email")}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                />
                {showError("email") && <p className="sdp-qm-error">Please enter a valid email.</p>}
              </div>

              <div className="sdp-qm-field" onBlur={(e) => {
                /* Left the whole phone field (code picker included), not just
                   moved between its two halves. */
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) touch("phone");
              }}>
                <span className="sdp-qm-label" id="sdp-qm-phone-label">Phone number</span>
                <PhoneField
                  code={country}
                  onCode={setCountry}
                  value={phone}
                  onChange={setPhone}
                  invalid={showError("phone")}
                  labelledBy="sdp-qm-phone-label"
                  onEnter={next}
                />
                {showError("phone") && (
                  <p className="sdp-qm-error">
                    {country === "IN"
                      ? "Please enter a valid 10-digit mobile number."
                      : "Please enter a valid phone number."}
                  </p>
                )}
              </div>

              <div className="sdp-qm-field">
                <label className="sdp-qm-label" htmlFor="sdp-qm-city">City</label>
                <input
                  id="sdp-qm-city"
                  className={`sdp-qm-input${showError("city") ? " is-invalid" : ""}`}
                  type="text"
                  enterKeyHint="go"
                  autoComplete="address-level2"
                  autoCapitalize="words"
                  placeholder="Your city"
                  aria-invalid={showError("city") || undefined}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => touch("city")}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                />
                {showError("city") && <p className="sdp-qm-error">Please enter your city.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="sdp-qm-nav">
          {step > 0 ? (
            <button type="button" className="sdp-qm-back" onClick={back}>
              Back
            </button>
          ) : (
            <span />
          )}
          {/* Live on the contact step even while incomplete, so a press shows
              which field is missing instead of a dead button. */}
          <button
            type="button"
            className="sdp-qm-next"
            disabled={!ready && q.kind !== "contact"}
            onClick={next}
          >
            {last ? "Book My Free Call" : "Continue"}
            <span className="arrow" aria-hidden>
              <ArrowGlyph />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

