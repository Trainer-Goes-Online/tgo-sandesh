import type { Metadata } from "next";

import BookingPage from "@/components/book/BookingPage";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Pick Your Slot · Extreme or Nothing",
  description: "Choose the date and time for your 1:1 Physique Transformation Strategy Call.",
  robots: { index: false, follow: false },
};

/** In Next 16 `searchParams` arrives as a promise, and a repeated key arrives
 *  as an array. Both are flattened once, here. */
type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] ?? "" : v ?? "").trim();

/**
 * THE BOOKING PAGE. Where every landing-page CTA lands: the call is free, so
 * there is nothing between the click and the calendar.
 */
export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  /* Prefill for the calendar, for any link that carries a name or an email. */
  const prefill = {
    name: first(sp.name),
    email: first(sp.email),
  };

  /* `booked=1` is set by the redirect Cal fires on a completed booking. */
  const booked = first(sp.booked) === "1";

  return (
    <div className="eon-book">
      <BookingPage prefill={prefill} booked={booked} />
      <SiteFooter />
    </div>
  );
}
