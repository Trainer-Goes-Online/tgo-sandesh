import { NextResponse } from "next/server";

import { TRACKING_CONFIG, capiReady } from "@/lib/tracking-config";
import { sendCapiEvent, sha256Hex, type StandardEvent } from "@/lib/meta-capi";

/**
 * The browser's route into Meta CAPI. The allow-list below is what keeps a
 * single public endpoint from becoming a hole: only reviewed names are
 * accepted, so nobody who learns this URL can post a fake conversion.
 *
 * The client IP and user agent are read from THIS request's headers, which is
 * the correct source: this is a fetch from the visitor's own browser.
 */
const ALLOWED: StandardEvent[] = ["ViewContent", "Lead", "QualifiedLead", "Schedule"];

export async function POST(req: Request) {
  if (!capiReady()) {
    return NextResponse.json({ ok: false, reason: "capi-not-configured" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const eventName = String(body.eventName ?? "") as StandardEvent;
  if (!ALLOWED.includes(eventName)) {
    return NextResponse.json(
      { ok: false, reason: "event-not-allowed" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email : "";
  const fbp = typeof body.fbp === "string" ? body.fbp : undefined;

  /* Dedup keys, deterministic so Meta's 48h window collapses double-fires:
     by email where there is one, otherwise by the browser's _fbp. */
  const seed = email || fbp || `${Date.now()}_${Math.random()}`;
  const eventId = sha256Hex(`${seed}|${eventName}`);

  const result = await sendCapiEvent({
    pixelId: TRACKING_CONFIG.meta.pixelId,
    accessToken: TRACKING_CONFIG.meta.accessToken,
    eventName,
    eventId,
    /* Reduced to its origin inside sendCapiEvent, server-side, rather than
       trusted from the caller: the caller is a browser posting
       window.location.href, which is the value carrying the path and the
       fbclid. */
    eventSourceUrl:
      (typeof body.eventSourceUrl === "string" && body.eventSourceUrl) ||
      TRACKING_CONFIG.fallbackEventSourceUrl,
    user: {
      email: email || undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      firstName: typeof body.firstName === "string" ? body.firstName : undefined,
      lastName: typeof body.lastName === "string" ? body.lastName : undefined,
      country:
        typeof body.country === "string" && body.country.length === 2
          ? body.country.toLowerCase()
          : "in",
      city: typeof body.city === "string" ? body.city : undefined,
      externalId: typeof body.externalId === "string" ? body.externalId : undefined,
      fbc: typeof body.fbc === "string" ? body.fbc : undefined,
      fbp,
      clientIp:
        req.headers.get("cf-connecting-ip")?.trim() ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        undefined,
      clientUserAgent: req.headers.get("user-agent") ?? undefined,
    },
    testEventCode: TRACKING_CONFIG.meta.testEventCode || undefined,
  });

  return NextResponse.json({ ok: result.ok, eventName, eventId });
}
