import type { Metadata } from "next";

import BookingPage from "@/components/book/BookingPage";
import SiteFooter from "@/components/SiteFooter";

import { readBookingState } from "./order-status";

export const metadata: Metadata = {
  title: "Pick Your Slot · Extreme or Nothing",
  description: "Choose the date and time for your 1:1 Physique Transformation Strategy Call.",
  /* Never indexable: a post-payment page, and a search result for it would
     send unpaid strangers into the calendar. */
  robots: { index: false, follow: false },
};

/* This page asks Razorpay a live question about a specific order on every
   request, so it can never be prerendered or cached. */
export const dynamic = "force-dynamic";

/** In Next 16 `searchParams` arrives as a promise, and a repeated key arrives
 *  as an array. Both are flattened once, here. */
type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] ?? "" : v ?? "").trim();

/**
 * THE BOOKING PAGE. Where every paid buyer lands, from the checkout.
 *
 * The payment is settled FIRST, on the server, before any of it renders: the
 * buyer has just been charged and the checkout told them they would land on a
 * calendar. A Server Component, so there is no flash of a calendar that then
 * disappears. The interactivity (the Cal embed, the Purchase pixel, Schedule)
 * lives in the client component below it.
 */
export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  /* `o` and `p`, exactly as bookingHref() in src/lib/funnel.ts writes them. */
  const state = await readBookingState(first(sp.o), first(sp.p));

  /* `booked=1` is set by the redirect Cal fires on a completed booking. */
  const booked = first(sp.booked) === "1";

  return (
    <div className="eon-book">
      <BookingPage state={state} booked={booked} />
      <SiteFooter />
    </div>
  );
}
