import { bookingHref } from "@/lib/funnel";
import { sendCapiEvent } from "@/lib/meta-capi";
import { readOrderContext, type OrderContext } from "@/lib/order-notes";
import { pabblyReady, sendPabbly } from "@/lib/pabbly";
import {
  TRACKING_CONFIG,
  capiReady,
  isTestMode,
  razorpayAuthHeader,
  razorpayReady,
} from "@/lib/tracking-config";

/**
 * SERVER-ONLY. Everything about a PAID order, in one place, so the three
 * places that learn about a payment (the checkout's verify call, the Razorpay
 * webhook, the /book render) read it, and report it, identically.
 */

/** Razorpay ids are shape-checked before they are put in a URL, so no query
 *  parameter can be bent into a path against Razorpay's API. */
export const ORDER_ID = /^order_[A-Za-z0-9]{6,32}$/;
export const PAYMENT_ID = /^pay_[A-Za-z0-9]{6,32}$/;

const TIMEOUT_MS = 6000;

export type RzpPayment = {
  id?: string;
  order_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  email?: string;
  contact?: string;
  created_at?: number;
  notes?: Record<string, unknown> | unknown[];
};

/** A payment that counts as money received. `authorized` is included because
 *  an account without auto-capture leaves a successful payment there until it
 *  is captured, and the buyer has still paid. */
export const isPaidStatus = (s: unknown) => s === "captured" || s === "authorized";

async function rzpGet<T>(path: string): Promise<T | null> {
  if (!razorpayReady()) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      headers: { authorization: razorpayAuthHeader() },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const fetchPayment = (id: string) =>
  PAYMENT_ID.test(id) ? rzpGet<RzpPayment>(`/payments/${id}`) : Promise.resolve(null);

export const fetchOrder = (id: string) =>
  ORDER_ID.test(id)
    ? rzpGet<{ id?: string; status?: string; notes?: Record<string, unknown> | unknown[] }>(
        `/orders/${id}`,
      )
    : Promise.resolve(null);

export async function fetchOrderPayments(id: string): Promise<RzpPayment[]> {
  if (!ORDER_ID.test(id)) return [];
  const r = await rzpGet<{ items?: RzpPayment[] }>(`/orders/${id}/payments`);
  return r?.items ?? [];
}

/** Razorpay returns `notes: []` when an entity has none. */
export const notesOf = (n: unknown): Record<string, unknown> =>
  n && typeof n === "object" && !Array.isArray(n) ? (n as Record<string, unknown>) : {};

export type Buyer = {
  ctx: OrderContext;
  /** Razorpay's, where it has them: what the buyer actually paid with. */
  email: string;
  phone: string;
  country: string;
};

export function buyerOf(payment: RzpPayment): Buyer {
  const notes = notesOf(payment.notes);
  const ctx = readOrderContext(notes);
  return {
    ctx,
    email: String(payment.email ?? "") || String(notes.email ?? ""),
    phone: String(payment.contact ?? "") || ctx.phone,
    country: (ctx.country || "in").toLowerCase(),
  };
}

/**
 * Meta CAPI Purchase. event_id is the payment id: unique per payment, stable
 * across the verify call, webhook retries and the browser pixel, so Meta
 * collapses them into one sale.
 *
 * `live` is the buyer's OWN request signals when the caller has them (the
 * verify route is a fetch from their browser). The webhook has none, so it
 * falls back to the signals create-order wrote into the notes.
 */
export async function sendPurchaseCapi(
  payment: RzpPayment,
  live: { clientIp?: string; clientUserAgent?: string; fbc?: string; fbp?: string } = {},
) {
  if (!capiReady()) return { ok: false, status: 0, body: "capi-not-configured" as unknown };
  const { ctx, email, phone, country } = buyerOf(payment);
  const valueRupees = Number(payment.amount ?? 0) / 100 || TRACKING_CONFIG.amountRupees;

  return sendCapiEvent({
    pixelId: TRACKING_CONFIG.meta.pixelId,
    accessToken: TRACKING_CONFIG.meta.accessToken,
    eventName: "Purchase",
    eventId: String(payment.id ?? ""),
    /* Origin only: a path is a description, and this offer is sold against a
       body. */
    eventSourceUrl: TRACKING_CONFIG.fallbackEventSourceUrl,
    user: {
      email: email || undefined,
      phone: phone || undefined,
      firstName: ctx.firstName || undefined,
      lastName: ctx.lastName || undefined,
      country,
      city: ctx.city || undefined,
      externalId: ctx.externalId || undefined,
      fbc: live.fbc || ctx.fbc || undefined,
      fbp: live.fbp || ctx.fbp || undefined,
      clientIp: live.clientIp || ctx.clientIp || undefined,
      clientUserAgent: live.clientUserAgent || ctx.clientUserAgent || undefined,
    },
    valueRupees,
    currency: String(payment.currency ?? "") || TRACKING_CONFIG.currency,
    orderId: String(payment.order_id ?? "") || undefined,
    testEventCode: TRACKING_CONFIG.meta.testEventCode || undefined,
  });
}

/** The Pabbly "purchase" row, the only Pabbly hand-off in the funnel. Sent
 *  from the webhook only, so each sale is one row. */
export async function sendPurchasePabbly(payment: RzpPayment) {
  if (!pabblyReady()) return { ok: false, status: 0 };
  const notes = notesOf(payment.notes);
  const { ctx, email, phone, country } = buyerOf(payment);
  const paymentId = String(payment.id ?? "");
  const orderId = String(payment.order_id ?? "");
  const capturedAt = Number(payment.created_at ?? 0);
  const origin = TRACKING_CONFIG.fallbackEventSourceUrl;

  return sendPabbly({
    event: "purchase",
    leadId: String(notes.lead_id ?? ""),
    createdAt:
      Number.isFinite(capturedAt) && capturedAt > 0
        ? new Date(capturedAt * 1000).toISOString()
        : new Date().toISOString(),
    firstName: ctx.firstName,
    lastName: ctx.lastName,
    email,
    phone,
    countryCode: country.toUpperCase(),
    dialCode: ctx.dialCode,
    city: ctx.city,
    fbc: ctx.fbc,
    fbp: ctx.fbp,
    clientIp: ctx.clientIp,
    clientUserAgent: ctx.clientUserAgent,
    externalId: ctx.externalId,
    gaClientId: ctx.gaCid,
    eventSourceUrl: `${origin}/checkout`,
    isTest: isTestMode(),
    utmSource: ctx.utmSource,
    utmMedium: ctx.utmMedium,
    utmCampaign: ctx.utmCampaign,
    utmContent: ctx.utmContent,
    utmTerm: ctx.utmTerm,
    campaignId: ctx.campaignId,
    adsetId: ctx.adsetId,
    adId: ctx.adId,
    campaignName: ctx.campaignName,
    adsetName: ctx.adsetName,
    adName: ctx.adName,
    placement: ctx.placement,
    siteSourceName: ctx.siteSourceName,
    fbclid: ctx.fbclid,
    referrer: ctx.referrer,
    landingUrl: ctx.landingUrl,
    product: TRACKING_CONFIG.itemName,
    amountRupees: Number(payment.amount ?? 0) / 100 || TRACKING_CONFIG.amountRupees,
    currency: String(payment.currency ?? "") || TRACKING_CONFIG.currency,
    orderId,
    paymentId,
    initiateCheckoutEventId: ctx.initiateCheckoutEventId,
    purchaseEventId: paymentId,
    bookingUrl: `${origin}${bookingHref(paymentId, orderId)}`,
  });
}
