"use client";

import { LEGAL, PRICE } from "@/app/_legal/legal";
import { collectSignals } from "@/lib/client-signals";
import { GA4_ITEM_ID } from "@/lib/funnel";
import {
  ga4AddPaymentInfo,
  ga4AddToCart,
  ga4BeginCheckout,
  ga4Purchase,
  ga4ViewItem,
  once,
  type Ga4Item,
} from "@/lib/ga4";

/**
 * The one place a page calls to record something. Each function fires the
 * matching STANDARD event on both platforms: Meta by name through the CAPI
 * route, GA4 by its own recommended name. Mapping the two vocabularies here
 * keeps the translation in one file instead of at every call site.
 */

const VALUE = PRICE.amount;
const ITEM: Ga4Item = {
  item_id: GA4_ITEM_ID,
  /* GA4 gets a readable name. Meta gets none: see the classification note at
     the top of lib/meta-capi.ts. */
  item_name: LEGAL.product,
  price: VALUE,
  quantity: 1,
};
const money = { value: VALUE, currency: "INR", items: [ITEM] };

type Person = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  /** ISO 3166-1 alpha-2, from the checkout's country picker. */
  country?: string;
};

/** Fire-and-forget: analytics must never block or fail a click. */
function capi(eventName: string, person: Person = {}) {
  const s = collectSignals();
  try {
    void fetch("/api/meta/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventName, ...s, ...person }),
      keepalive: true, // survives the navigation a CTA click causes
    });
  } catch {
    /* ignore */
  }
}

/** Landing page: the offer has been seen. Once per SESSION, not per browser
 *  lifetime, so a returning visitor still feeds the retargeting audience. */
export function trackViewItem() {
  once("view_item", () => {
    capi("ViewContent");
    ga4ViewItem(money);
  });
}

/**
 * Checkout ARRIVAL. Named for the Meta event it sends, and it fires from the
 * checkout's own mount, never from a CTA click on the landing page.
 *
 * The landing page carries seven CTAs. A click listener counts a reader who
 * taps two of them twice, which inflates AddToCart volume and deflates the
 * cost-per-AddToCart the ads are judged on. A click is also not an arrival.
 * Counting the mount counts the people who actually got there, and it is the
 * ONLY Meta event a direct arrival (an email, a retargeting ad, a bookmark)
 * will ever produce before the pay tap.
 */
export function trackAddToCart() {
  capi("AddToCart");
  ga4AddToCart(money);
}

/** The checkout page has loaded. GA4's half of the arrival. */
export function trackBeginCheckout() {
  ga4BeginCheckout(money);
}

/**
 * Details are valid and the payment sheet is opening. This is the real intent,
 * and it is why InitiateCheckout does NOT fire on checkout page load: a
 * page-load IC teaches Meta to buy people who land rather than people who try
 * to pay. On a previous funnel that produced 96 "checkouts initiated" against
 * 1 booking.
 */
export function trackInitiateCheckout(person: Person) {
  capi("InitiateCheckout", person);
  ga4AddPaymentInfo({ value: VALUE, currency: "INR" });
}

/**
 * GA4 only. Meta's Purchase comes from the Razorpay webhook, where the payment
 * is proven. Firing it here as well would double-count every sale.
 *
 * Called from src/components/book/BookingPage.tsx, once, and from nowhere
 * else. That page confirms the order with Razorpay first and passes the
 * payment id Razorpay itself reports, not the one on the query string. The GA4
 * server-side purchase from the webhook is keyed on the same payment id, so
 * GA4 collapses the pair rather than counting the sale twice.
 */
export function trackPurchase(transactionId: string) {
  /* Keyed on the payment id, not a fixed string: a refresh, a back-forward or
     the buyer reopening the link must not count the sale twice, but a genuine
     second purchase later must still count. */
  once(`purchase_${transactionId}`, () => {
    ga4Purchase({ transactionId, ...money });
  });
}
