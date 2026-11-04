/**
 * SERVER-ONLY. One-line, greppable logs for Vercel's Runtime Logs.
 *
 * Every line is `[tag] message key=value key=value`, so a single search for
 * `[meta-capi]`, `[pabbly]`, `[rzp-webhook]`, `[create-order]` or `[meta-event]`
 * shows exactly what the funnel just did. No raw personal data is ever logged:
 * email and phone are masked, and Meta user_data is reported as the list of
 * FIELDS sent (that list is what Event Match Quality is scored on), not values.
 */

type Fields = Record<string, unknown>;

const fmt = (fields: Fields) =>
  Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" ");

export const logInfo = (tag: string, message: string, fields: Fields = {}) =>
  console.log(`[${tag}] ${message} ${fmt(fields)}`.trimEnd());

export const logWarn = (tag: string, message: string, fields: Fields = {}) =>
  console.warn(`[${tag}] ${message} ${fmt(fields)}`.trimEnd());

export const logError = (tag: string, message: string, fields: Fields = {}) =>
  console.error(`[${tag}] ${message} ${fmt(fields)}`.trimEnd());

export const maskEmail = (v: string) => {
  const [u = "", d = ""] = v.split("@");
  return u ? `${u.slice(0, 2)}***@${d}` : "";
};

export const maskPhone = (v: string) => (v.length > 4 ? `${v.slice(0, 3)}*****${v.slice(-2)}` : "");
