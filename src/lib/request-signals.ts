/**
 * Signals read off the BUYER's own request, at create-order only: the Razorpay
 * webhook's headers describe Razorpay's server, not the buyer's device, and a
 * confidently wrong device signature is worse for matching than none.
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

export function readClientIp(req: Request): string {
  for (const h of IP_HEADERS) {
    const v = (req.headers.get(h) ?? "").trim();
    if (looksLikeIp(v)) return v;
  }
  /* First entry, not last: the chain reads client, then proxy, then proxy. */
  const first = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  return looksLikeIp(first ?? "") ? (first as string) : "";
}

export function readClientUserAgent(req: Request): string {
  return (req.headers.get("user-agent") ?? "").trim();
}

/** Read one cookie off the request, server side. create-order is same-origin,
 *  so the buyer's `_fbc`, `_fbp` and attribution cookie are already on it. */
export function readRequestCookie(req: Request, name: string): string {
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
