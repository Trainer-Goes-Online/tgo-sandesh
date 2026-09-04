import type { Metadata } from "next";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Secure Checkout · Extreme or Nothing",
  description: "Book your 1:1 Physique Transformation Strategy Call with Sandesh.",
  robots: { index: false, follow: false },
};

/**
 * Checkout, in the live SDP funnel's structure: a trust announce strip, then a
 * two-column main with the form panel beside the order summary, then the
 * identity footer Razorpay's review looks for.
 *
 * Payment IS wired, in CheckoutForm: Razorpay order -> sheet -> booking page,
 * with Meta and GA4 on the rail. Purchase is fired by the signature-verified
 * webhook at /api/razorpay/webhook and by nothing on this page.
 *
 * The redirect target /book is built (pass 2). It confirms the order with
 * Razorpay before it shows anything, so a typed or stale link cannot walk
 * someone into the calendar. ⚠️ It still needs NEXT_PUBLIC_BOOKING_CALENDAR_URL:
 * without the scheduling link it renders a labelled stand-in rather than a slot
 * picker, so do not point ads here until that value is set.
 */
export default function CheckoutPage() {
  return (
    <div className="eon-checkout">
      <div className="checkout-announce" role="region" aria-label="Checkout trust">
        <span className="checkout-announce-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secure Checkout
        </span>
        <span className="checkout-announce-dot" aria-hidden />
        <span className="checkout-announce-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          1:1 With Sandesh
        </span>
        <span className="checkout-announce-dot" aria-hidden />
        <span className="checkout-announce-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          Razorpay Verified · 256-bit SSL
        </span>
      </div>

      <main className="checkout-page">
        <CheckoutForm />
      </main>

      <SiteFooter />
    </div>
  );
}
