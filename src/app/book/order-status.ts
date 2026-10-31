import { ORDER_ID, PAYMENT_ID, buyerOf, fetchOrder, fetchOrderPayments, isPaidStatus } from "@/lib/purchase";
import { razorpayReady } from "@/lib/tracking-config";

/**
 * SERVER-ONLY. "Has this order actually been paid?", asked by the booking page
 * while it renders, before it shows anyone a calendar. Asks Razorpay directly
 * (a Server Component cannot fetch our own relative /api url).
 *
 * It also reads the BUYER back off the order: name, email, phone, city and
 * country as the checkout collected them. That is what prefills the calendar,
 * so nobody retypes details they just gave the checkout, and what the Schedule
 * event matches on.
 *
 * WHAT THIS IS NOT: proof for anything that matters. Meta's Purchase comes
 * from the signature-checked verify route and webhook. This decides what the
 * buyer is shown, and keys the browser pixel's Purchase on Razorpay's own
 * payment id.
 */

/* A hanging Razorpay call would hang the page render, and this page is the
   first thing a buyer sees after being charged. The lookups time out (see
   lib/purchase.ts) and fall through to "unconfirmed", which still shows them a
   calendar. */

export type UnconfirmedReason = "no-order-id" | "bad-order-id" | "not-configured" | "gateway";

export type BuyerPrefill = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
};

export const EMPTY_BUYER: BuyerPrefill = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  country: "",
};

export type BookingState =
  /** Razorpay says the money is received. */
  | { status: "paid"; paymentId: string; orderId: string; buyer: BuyerPrefill }
  /** Razorpay knows this order and says it has NOT been paid. */
  | { status: "unpaid" }
  /** We could not find out either way. */
  | { status: "unconfirmed"; reason: UnconfirmedReason };

export async function readBookingState(orderId: string, queryPaymentId: string): Promise<BookingState> {
  if (!orderId) return { status: "unconfirmed", reason: "no-order-id" };
  if (!ORDER_ID.test(orderId)) return { status: "unconfirmed", reason: "bad-order-id" };
  if (!razorpayReady()) return { status: "unconfirmed", reason: "not-configured" };

  const order = await fetchOrder(orderId);
  if (!order) return { status: "unconfirmed", reason: "gateway" };

  const payments = await fetchOrderPayments(orderId);
  const paid = payments.find((p) => isPaidStatus(p.status));

  /* `created` / `attempted` with no successful payment is a KNOWN negative,
     shown differently from an unknown: an unknown still gets a calendar. */
  if (order.status !== "paid" && !paid) return { status: "unpaid" };

  /* Taken from Razorpay rather than the query string wherever possible: `?p=`
     is typed as easily as it is redirected to, and a made-up id would poison
     the dedup between the pixel's Purchase and the server's. */
  const paymentId =
    paid?.id && PAYMENT_ID.test(paid.id) ? paid.id : PAYMENT_ID.test(queryPaymentId) ? queryPaymentId : "";

  const buyer = paid ? buyerOf({ ...paid, notes: paid.notes ?? order.notes }) : null;
  return {
    status: "paid",
    paymentId,
    orderId,
    buyer: buyer
      ? {
          firstName: buyer.ctx.firstName,
          lastName: buyer.ctx.lastName,
          email: buyer.email,
          phone: buyer.phone,
          city: buyer.ctx.city,
          country: buyer.country,
        }
      : EMPTY_BUYER,
  };
}
