/**
 * The operator's identity, in one place.
 *
 * Razorpay's merchant review looks for the registered name, a full postal
 * address and a working phone plus email ON THE SITE, not only inside a policy
 * page, so the footer renders all four from here as well. One definition means
 * the three policies and the footer can never disagree, which is the failure
 * that gets an account held.
 *
 * Every value below was supplied by Atul on 4 Sep 2026. Nothing here is
 * inferred.
 */
export const LEGAL = {
  /** As registered. Must match the PAN and GST records character for character:
   *  a different spelling or a dropped suffix makes this the wrong person in a
   *  contract. */
  entity: "TRANSFORMMEBRO PVT LTD.",
  /** Supplied as identical to the registered name, so the policies read
   *  "TRANSFORMMEBRO PVT LTD." throughout rather than "trading as". */
  tradeName: "TRANSFORMMEBRO PVT LTD.",
  address: "201, SRK Habitat, AECS Layout, Singasandra, Bengaluru 560 068",
  phone: "+91 81051 95782",
  /** Digits and a leading + only, for the tel: href. */
  phoneHref: "+918105195782",
  /** Refund and data-deletion requests both land here and both carry a reply
   *  window, so it has to be an inbox someone reads. */
  email: "support@transformmebro.com",
  jurisdiction: "Bengaluru, Karnataka",

  /** The funnel-facing name. The page sells the method; the policies name the
   *  company. Deliberately not the same string as `entity`. */
  brand: "Extreme or Nothing",
  product: "1:1 Physique Transformation Strategy Call",

  /** ⚠️ Atul's draft read "x August 2026" with the day left as a literal x, and
   *  August has passed. Set to the day these were written. It must match the
   *  day they actually go live, so bump it if the launch slips. */
  effectiveDate: "4 September 2026",
} as const;

/** The booking fee, in rupees, and the anchor it is shown against. */
export const PRICE = { amount: 97, anchor: 999 } as const;
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
