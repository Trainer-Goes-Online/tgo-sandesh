"use client";

import { LEGAL, PRICE } from "@/app/_legal/legal";
import { collectSignals, getOrCreateExternalId } from "@/lib/client-signals";
import { GA4_ITEM_ID } from "@/lib/funnel";
import {
  ga4AddToCart,
  ga4BeginCheckout,
  ga4Purchase,
  ga4ViewItem,
  once,
  type Ga4Item,
} from "@/lib/ga4";

/**
 * The one place a page calls to record something. Each function fires the
 * matching STANDARD event on every platform: Meta by name, GA4 by its own
 * recommended name. Mapping the vocabularies here keeps the translation in one
 * file instead of at every call site.
 *
 * ── HOW EVERY META EVENT IS SENT (for Event Match Quality) ────────────────
 * Twice, with ONE event id:
 *   1. the browser pixel, `fbq('track', name, data, { eventID })`, which
 *      carries `_fbp` / `_fbc` natively and the advanced-matching keys set at
 *      pixel init (see `rememberPerson` and components/MetaPixel.tsx);
 *   2. the Conversions API, through /api/meta/event, with every hashed key we
 *      hold: em, ph, fn, ln, ct, country, external_id, plus fbp, fbc, the
 *      client IP and the user agent.
 * Meta deduplicates the pair on (event name, event id), so nothing is counted
 * twice, and each copy fills the gaps in the other.
 *
 * Purchase is the exception on the server half: it is NEVER sent through the
 * public /api/meta/event route. Its CAPI copy comes from the signature-checked
 * /api/razorpay/verify and /api/razorpay/webhook, keyed on the Razorpay payment
 * id, and the browser pixel copy below uses that same id.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

const VALUE = PRICE.amount;
const CURRENCY = PRICE.currency;
const ITEM: Ga4Item = {
  item_id: GA4_ITEM_ID,
  /* GA4 gets a readable name. Meta gets none: see the classification note at
     the top of lib/meta-capi.ts. */
  item_name: LEGAL.product,
  price: VALUE,
  quantity: 1,
};
const money = { value: VALUE, currency: CURRENCY, items: [ITEM] };

export type Person = {
  email?: string;
  firstName?: string;
  lastName?: string;
  /** E.164: "+919075453949". */
  phone?: string;
  /** ISO 3166-1 alpha-2. */
  country?: string;
  city?: string;
};

export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** The browser half. Retries briefly, because an effect on first load can beat
 *  the afterInteractive pixel script; never throws into a click. */
function pixel(name: string, data: Record<string, unknown>, eventId: string, tries = 0) {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  const fbq = window.fbq;
  if (typeof fbq === "function") {
    try {
      fbq("track", name, data, { eventID: eventId });
    } catch {
      /* ignore */
    }
    return;
  }
  if (tries < 20) window.setTimeout(() => pixel(name, data, eventId, tries + 1), 250);
}

/** The server half. Fire-and-forget, keepalive so it survives the navigation a
 *  click causes. */
function capi(eventName: string, eventId: string, person: Person = {}) {
  try {
    void fetch("/api/meta/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventName, eventId, ...collectSignals(), ...person }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

/* ── Advanced matching for the browser pixel ──────────────────────────────
   Stored HASHED, never as plain text: SHA-256 of the same normalised strings
   lib/meta-capi.ts hashes server-side, so both copies of an event carry
   identical keys. MetaPixel's init reads this on every page load, which is
   what makes the pixel's /book and /thank-you events match on email and
   phone, not only on _fbp. */
export const AM_KEY = "eon_am";

async function sha256(v: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function rememberPerson(p: Person): Promise<void> {
  if (typeof window === "undefined" || !crypto?.subtle) return;
  try {
    const norm: Record<string, string> = {
      em: (p.email ?? "").trim().toLowerCase(),
      ph: (p.phone ?? "").replace(/\D/g, ""),
      fn: (p.firstName ?? "").trim().toLowerCase(),
      ln: (p.lastName ?? "").trim().toLowerCase(),
      ct: (p.city ?? "").trim().toLowerCase().replace(/[^a-z]/g, ""),
      country: (p.country ?? "").trim().toLowerCase(),
    };
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(norm)) if (v) out[k] = await sha256(v);
    window.localStorage.setItem(AM_KEY, JSON.stringify(out));
  } catch {
    /* private mode: the CAPI copy still carries everything */
  }
}

/* ── The funnel ───────────────────────────────────────────────────────── */

/** Landing page: the offer has been seen. Once per SESSION, not per browser
 *  lifetime, so a returning visitor still feeds the retargeting audience. */
export function trackViewItem() {
  once("view_item", () => {
    const id = newEventId();
    pixel("ViewContent", { value: VALUE, currency: CURRENCY }, id);
    capi("ViewContent", id);
    ga4ViewItem(money);
  });
}

/** A landing CTA was clicked, on its way to /checkout. */
export function trackAddToCart() {
  const id = newEventId();
  pixel("AddToCart", { value: VALUE, currency: CURRENCY }, id);
  capi("AddToCart", id);
  ga4AddToCart(money);
}

/**
 * The Pay button was pressed with valid details. This is the real intent, and
 * it is why InitiateCheckout does NOT fire on checkout page load: a page-load
 * IC teaches Meta to buy people who land rather than people who try to pay.
 *
 * Returns the event id, so create-order can stamp it on the order and the
 * Pabbly rows can be joined to it.
 */
export function trackInitiateCheckout(person: Person): string {
  const id = newEventId();
  void rememberPerson(person);
  pixel("InitiateCheckout", { value: VALUE, currency: CURRENCY, num_items: 1 }, id);
  capi("InitiateCheckout", id, person);
  ga4BeginCheckout(money);
  return id;
}

/**
 * Browser half of Purchase, plus GA4's purchase. Called from /book once
 * Razorpay has confirmed the order is paid, with the payment id Razorpay
 * reports. The CAPI half (same id) comes from /api/razorpay/verify and the
 * webhook. Keyed on the payment id: a refresh must not count the sale twice,
 * a genuine second purchase later must.
 */
export function trackPurchase(paymentId: string, orderId: string) {
  once(`purchase_${paymentId}`, () => {
    pixel("Purchase", { value: VALUE, currency: CURRENCY, order_id: orderId || undefined }, paymentId);
    ga4Purchase({ transactionId: paymentId, ...money });
  });
}

/** Booking page: Cal reported a completed booking. Carries everything the
 *  checkout collected (read back off the Razorpay order on /book). */
export function trackSchedule(person: Person, paymentId = "") {
  const key = paymentId || getOrCreateExternalId() || "session";
  once(`schedule_${key}`, () => {
    const id = paymentId ? `schedule_${paymentId}` : newEventId();
    pixel("Schedule", {}, id);
    capi("Schedule", id, person);
  });
}
