/**
 * WHAT THE STRATEGY CALL CONTAINS, in one place.
 *
 * ── WHY THIS FILE EXISTS (2026-09-22) ─────────────────────────────────────
 * These three lines were living as two identical literals, one in the
 * checkout form and one in the booking page, because importing them from the
 * checkout would have pulled that whole module (and its Razorpay config) into
 * the booking page's bundle. PENDING.md recorded the workaround as "EDIT
 * BOTH", which is a rule nobody remembers on the day.
 *
 * The thank-you page added on 2026-09-22 would have made it three copies, so
 * the constant moved here instead: a plain data module with no imports, which
 * costs any page that reads it nothing.
 *
 * ── THEY STILL NEED SANDESH'S SIGN-OFF ────────────────────────────────────
 * They were written during the build, not supplied by him, and they are the
 * only description anywhere of what the call actually contains. They now
 * appear on THREE surfaces (checkout, booking, thank-you), which raises the
 * cost of getting them wrong rather than lowering it. Edit here, once.
 */
export const WHAT_THE_CALL_COVERS = [
  "A personalised assessment of your current physique, training and nutrition to identify exactly what’s holding back your progress",
  "A clear 90–120 day transformation roadmap to reduce body fat, build visible muscle and push your natural physique towards its peak",
  "A walkthrough of the Extreme or Nothing Protocol and an honest assessment of whether it’s the right fit for your body, goals and commitment level",
] as const;
