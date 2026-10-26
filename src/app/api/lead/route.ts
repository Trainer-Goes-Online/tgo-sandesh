import crypto from "crypto";
import { NextResponse } from "next/server";

import { LEGAL } from "@/app/_legal/legal";
import { sha256Hex } from "@/lib/meta-capi";
import { pabblyReady, sendPabblyLead } from "@/lib/pabbly";
import { TRACKING_CONFIG } from "@/lib/tracking-config";

/**
 * The qualifying form's server hand-off: forwards one completed form to Pabbly.
 * Server-side so the workflow URL never reaches the browser. Meta's Lead and
 * QualifiedLead go separately through /api/meta/event.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** A plus, a non-zero first digit, at most 15 digits in all. */
const E164 = /^\+[1-9]\d{5,14}$/;

/* Public endpoint: every string is capped so a forged post cannot push an
   arbitrarily large row into the sheet. */
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  /* All four contact fields are mandatory (client, 2026-10-26), here as well
     as in the form, because the endpoint is public. Phone must be E.164 with
     no spaces: "+919075453949". */
  const name = str(body.name, 120);
  const email = str(body.email, 200);
  const phone = str(body.phone, 20);
  const city = str(body.city, 80);
  if (!name || !EMAIL.test(email) || !E164.test(phone) || city.length < 2) {
    return NextResponse.json({ ok: false, reason: "bad-input" }, { status: 400 });
  }
  if (!pabblyReady()) return NextResponse.json({ ok: false, reason: "pabbly-not-configured" });

  const countryCode = /^[A-Z]{2}$/.test(str(body.countryCode, 2)) ? str(body.countryCode, 2) : "";
  const dialCode = /^\+\d{1,4}$/.test(str(body.dialCode, 5)) ? str(body.dialCode, 5) : "";

  const [firstName, ...rest] = name.split(/\s+/);
  const utm = (typeof body.utm === "object" && body.utm ? body.utm : {}) as Record<string, unknown>;
  const bookingPath = str(body.bookingPath, 2000);

  const result = await sendPabblyLead({
    leadId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    firstName,
    lastName: rest.join(" "),
    email,
    phone,
    countryCode,
    dialCode,
    city,
    fbc: str(body.fbc),
    fbp: str(body.fbp),
    clientIp:
      req.headers.get("cf-connecting-ip")?.trim() ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "",
    clientUserAgent: req.headers.get("user-agent") ?? "",
    externalId: str(body.externalId),
    eventSourceUrl: str(body.eventSourceUrl, 1000),
    isTest: Boolean(TRACKING_CONFIG.meta.testEventCode),
    /* The same id /api/meta/event derives for this person's Lead, so a row in
       the sheet can be matched to the Meta event. */
    leadEventId: sha256Hex(`${email}|Lead`),
    utmSource: str(utm.source),
    utmMedium: str(utm.medium),
    utmCampaign: str(utm.campaign),
    utmContent: str(utm.content),
    utmTerm: str(utm.term),
    fbclid: str(body.fbclid),
    referrer: str(body.referrer, 1000),
    landingUrl: str(body.landingUrl, 1000),
    product: LEGAL.product,
    bookingUrl: bookingPath.startsWith("/")
      ? `${TRACKING_CONFIG.fallbackEventSourceUrl}${bookingPath}`
      : "",
    physique: str(body.physique),
    seriousness: str(body.seriousness, 4),
    investment: str(body.investment),
    decision: str(body.decision),
    qualified: body.qualified === true,
  });

  return NextResponse.json({ ok: result.ok });
}
