"use client";

/**
 * GA4 events, standard ecommerce names only, so the built-in funnel and
 * revenue reports populate with no custom configuration.
 *
 * The two vocabularies differ and that is expected: Meta's InitiateCheckout is
 * GA4's begin_checkout. Sending Meta's names to Google leaves Google's own
 * checkout funnel permanently empty.
 *
 * Money IS sent. "Pure event counts" keeps GA4 unable to answer what anything
 * cost or earned, which is the one question it is opened to answer.
 *
 * All failures are swallowed: analytics must never throw into a click.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type Ga4Item = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

type Money = { value: number; currency?: string; items?: Ga4Item[] };

function send(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
      return;
    }
    /* gtag.js has not finished loading. Queue onto dataLayer exactly as gtag
       itself would, by pushing the `arguments` object, so the tag replays the
       event when it initialises. Dropping it here instead would lose every
       event fired by an effect that beat the afterInteractive script, which is
       a race that only ever surfaces as quietly missing top-of-funnel data. */
    window.dataLayer = window.dataLayer || [];
    function gtagShim() {
      // eslint-disable-next-line prefer-rest-params
      (window.dataLayer as unknown[]).push(arguments);
    }
    (gtagShim as (...args: unknown[]) => void)("event", name, params);
  } catch {
    /* never throw into a click */
  }
}

const money = (m: Money) => ({
  value: m.value,
  currency: m.currency ?? "INR",
  ...(m.items && { items: m.items }),
});

export const ga4ViewItem = (m: Money) => send("view_item", money(m));
export const ga4AddToCart = (m: Money) => send("add_to_cart", money(m));
export const ga4BeginCheckout = (m: Money) => send("begin_checkout", money(m));
export const ga4AddPaymentInfo = (m: Money) => send("add_payment_info", money(m));
export const ga4Purchase = (m: Money & { transactionId: string }) =>
  send("purchase", { transaction_id: m.transactionId, ...money(m) });

/* Some events should fire once rather than on every render. The flag is
   stamped BEFORE the call so a rapid double-click or a tab closed
   mid-navigation still dedupes. */
export function once(key: string, fire: () => void) {
  if (typeof window === "undefined") return;

  /* This gate deliberately does NOT check for window.gtag.
     trackViewItem fires Meta's ViewContent from inside this callback. On a
     previous build the gtag check lived here, the project had no GA4 base tag,
     the check never passed, and Meta's ViewContent therefore never fired at
     all: the top-of-funnel event was killed by a missing Google tag, and the
     failure was invisible from both sides. A guard protects its own transport
     and nothing else. GA4's own send() queues safely on its own. */

  /* A purchase must never be counted twice for the same transaction, so those
     keys are remembered for the life of the browser. Everything else is a
     per-SESSION guard: a durable view_item key means a returning visitor
     generates no ViewContent ever again, which starves the retargeting
     audience and shrinks the optimisation signal. */
  const durable = key.startsWith("purchase_");
  const k = `eon_ga4_${key}`;
  try {
    const store = durable ? window.localStorage : window.sessionStorage;
    if (store.getItem(k)) return;
    store.setItem(k, "1");
  } catch {
    /* private mode: fire anyway rather than lose the event */
  }
  fire();
}
