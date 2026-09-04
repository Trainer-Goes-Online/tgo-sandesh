import type { Metadata } from "next";

import BookingPage from "@/components/book/BookingPage";
import SiteFooter from "@/components/SiteFooter";

import { readBookingState } from "./order-status";

export const metadata: Metadata = {
  title: "Pick Your Slot · Extreme or Nothing",
  description: "Choose the date and time for your 1:1 Physique Transformation Strategy Call.",
  /* Never indexable. It is a post-payment page, and a search result for it
     would send unpaid strangers into the calendar. */
  robots: { index: false, follow: false },
};

/* This page asks Razorpay a live question about a specific order on every
   request, so it can never be prerendered or cached. Without this Next would
   try to build it statically and the payment check would be answered once, at
   build time, for nobody. */
export const dynamic = "force-dynamic";

/** In Next 16 `searchParams` arrives as a promise, and a repeated key arrives
 *  as an array. Both are flattened once, here. */
type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] ?? "" : v ?? "").trim();

/**
 * THE BOOKING PAGE. Where every paid buyer lands.
 *
 * Structure follows the live SDP funnel's book-a-call page: confirmation strip,
 * hero with a two-step indicator, the calendar, what the fee covers, who they
 * are about to talk to, a final nudge, the identity footer, and a docked bar.
 * Theme is this project's own, ivory / charcoal / burnt copper.
 *
 * The confirmation is the FIRST thing resolved, before any of it renders,
 * because the buyer has just been charged and the checkout told them in so
 * many words that they would land on a calendar. Getting that wrong on this
 * page is worse than getting it wrong anywhere else on the site.
 *
 * A Server Component, so the payment is settled before the first byte and
 * there is no flash of a calendar that then disappears. All the interactivity
 * (the embed, the GA4 purchase, the docked bar) lives in the client component
 * below it.
 */
export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  /* `o` and `p`, exactly as bookingHref() in src/lib/funnel.ts writes them. */
  const state = await readBookingState(first(sp.o), first(sp.p));

  /* Prefill for the calendar. INERT TODAY: bookingHref() carries only the two
     ids, so neither key is ever present. It is read here because the moment
     the checkout is allowed to forward a name and an email, the calendar
     prefills with no further change, and a buyer typing their own details in
     twice is the commonest reason a paid slot never gets booked. */
  const prefill = {
    name: first(sp.name),
    email: first(sp.email),
  };

  return (
    <div className="eon-book">
      <BookingPage state={state} prefill={prefill} />
      <SiteFooter />
    </div>
  );
}
