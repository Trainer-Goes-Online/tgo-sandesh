"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BOOKING_HREF } from "@/lib/funnel";
import { sendLeadToPabbly, trackLead } from "@/lib/track";
import { ArrowGlyph, CheckGlyph } from "./sdp";

type Choice = { kind: "choice"; key: string; q: string; options: string[]; other?: string };
type Scale = { kind: "scale"; key: string; q: string; min: string; max: string };
type Text = {
  kind: "text";
  key: "name" | "email";
  q: string;
  type: "text" | "email";
  autoComplete: string;
  placeholder: string;
};
type Question = Choice | Scale | Text;

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
    kind: "text",
    key: "name",
    q: "Name",
    type: "text",
    autoComplete: "name",
    placeholder: "Your full name",
  },
  {
    kind: "text",
    key: "email",
    q: "Email",
    type: "email",
    autoComplete: "email",
    placeholder: "you@example.com",
  },
];

/** Every CTA carrying `data-qualify` opens this instead of navigating. Without
 *  JS the link still goes straight to the booking page. */
export default function QualifyModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState("");
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
  const ready =
    q.kind === "text"
      ? q.type === "email"
        ? EMAIL.test(picked.trim())
        : picked.trim().length > 0
      : Boolean(picked) && (!needsOther || otherText.trim().length > 0);
  const last = step === QUESTIONS.length - 1;

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
    if (!ready) return;
    if (!last) {
      setStep(step + 1);
      return;
    }
    const qualified = answers.investment !== NOT_READY;
    /* keepalive fetches inside, so the navigation below does not cancel them. */
    trackLead(answers.name, answers.email, qualified);

    /* Cal attaches `metadata[...]` query params to the booking it creates; the
       embed forwards this page's query string into the calendar. */
    const params = new URLSearchParams(window.location.search);
    for (const item of QUESTIONS) {
      /* Name and email are Cal's own booking fields: passed bare, they
         prefill the calendar instead of riding along as metadata. */
      if (item.kind === "text") {
        params.set(item.key, answers[item.key].trim());
        continue;
      }
      const value = answers[item.key] === OTHER ? `Other: ${otherText.trim()}` : answers[item.key];
      params.set(`metadata[${item.key}]`, value);
    }
    const bookingPath = `${BOOKING_HREF}?${params.toString()}`;

    sendLeadToPabbly({
      name: answers.name.trim(),
      email: answers.email.trim(),
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
            <input
              key={q.key}
              className="sdp-qm-input"
              type={q.type}
              inputMode={q.type === "email" ? "email" : undefined}
              enterKeyHint={last ? "go" : "next"}
              autoComplete={q.autoComplete}
              autoCapitalize={q.type === "email" ? "none" : "words"}
              placeholder={q.placeholder}
              aria-labelledby="sdp-qm-q"
              value={picked}
              onChange={(e) => pick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              data-autofocus=""
            />
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
          <button type="button" className="sdp-qm-next" disabled={!ready} onClick={next}>
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

