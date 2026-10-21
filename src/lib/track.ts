"use client";

import { LEGAL } from "@/app/_legal/legal";
import { collectSignals } from "@/lib/client-signals";
import { GA4_ITEM_ID } from "@/lib/funnel";
import { ga4ViewItem, once, type Ga4Item } from "@/lib/ga4";

/**
 * The one place a page calls to record something. Each function fires the
 * matching STANDARD event on both platforms: Meta by name through the CAPI
 * route, GA4 by its own recommended name. Mapping the two vocabularies here
 * keeps the translation in one file instead of at every call site.
 */

const ITEM: Ga4Item = {
  item_id: GA4_ITEM_ID,
  /* GA4 gets a readable name. Meta gets none: see the classification note at
     the top of lib/meta-capi.ts. */
  item_name: LEGAL.product,
  price: 0,
  quantity: 1,
};

type Person = { email?: string; firstName?: string; lastName?: string };

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
    ga4ViewItem({ value: 0, currency: "INR", items: [ITEM] });
  });
}

/** Qualifying form submitted. `Lead` for every submission, plus the custom
 *  `QualifiedLead` when the visitor chose an investment level. Meta only. */
export function trackLead(name: string, email: string, qualified: boolean) {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  const person = { email, firstName, lastName: rest.join(" ") || undefined };
  capi("Lead", person);
  if (qualified) capi("QualifiedLead", person);
}

/** The completed form, to Pabbly via /api/lead. Fire-and-forget, keepalive
 *  so the navigation to /book does not cancel it. */
export function sendLeadToPabbly(lead: {
  name: string;
  email: string;
  physique: string;
  seriousness: string;
  investment: string;
  decision: string;
  qualified: boolean;
  bookingPath: string;
}) {
  try {
    void fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...collectSignals(), ...lead }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

/** Booking page: Cal reported a completed booking. Meta only. Carries the
 *  qualify form's name and email (the /book prefill) so it matches like Lead. */
export function trackSchedule(name = "", email = "") {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  const person = {
    email: email.trim() || undefined,
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
  };
  once("schedule", () => capi("Schedule", person));
}
