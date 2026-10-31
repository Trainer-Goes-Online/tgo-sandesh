/**
 * Signals read off the BUYER's own request: create-order, verify and the /book
 * render. Never off the Razorpay webhook, whose headers describe Razorpay's
 * server, not the buyer's device, and a confidently wrong device signature is
 * worse for matching than none.
 */

const IP_HEADERS = [
  "cf-connecting-ip",
  "x-vercel-forwarded-for",
  "x-real-ip",
] as const;

/** IPv4 dotted quad, or an IPv6 form (possibly with a zone or brackets). */
function looksLikeIp(v: string): boolean {
  if (!v) return false;
  const s = v.replace(/^\[|\]$/g, "");
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(s) || /^[0-9a-f:]+$/i.test(s);
}

type HeaderSource = { get(name: string): string | null };

export function readClientIp(req: Request | { headers: HeaderSource }): string {
  for (const h of IP_HEADERS) {
    const v = (req.headers.get(h) ?? "").trim();
    if (looksLikeIp(v)) return v;
  }
  /* First entry, not last: the chain reads client, then proxy, then proxy. */
  const first = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  return looksLikeIp(first ?? "") ? (first as string) : "";
}

export function readClientUserAgent(req: Request | { headers: HeaderSource }): string {
  return (req.headers.get("user-agent") ?? "").trim();
}

/** Read one cookie off the request, server side. The payment routes are
 *  same-origin, so the buyer's `_fbc`, `_fbp` and attribution cookie are
 *  already on them. */
export function readRequestCookie(req: Request | { headers: HeaderSource }, name: string): string {
  const header = req.headers.get("cookie") ?? "";
  if (!header) return "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return "";
}
