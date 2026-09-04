"use client";

import PolicyHero from "@/components/policy/PolicyHero";
import PolicyToc from "@/components/policy/PolicyToc";
import PolicyContactCTA from "@/components/policy/PolicyContactCTA";
import SiteFooter from "@/components/SiteFooter";
import { useTocActive } from "@/components/policy/useTocActive";
import { LEGAL } from "@/app/_legal/legal";

/**
 * Atul's copy, verbatim, in the live SDP funnel's policy structure: pill
 * eyebrow masthead, sticky "On This Page" rail beside the body, ruled sections,
 * charcoal contact close, footer carrying the operator identity.
 *
 * Two substitutions only, both flagged: "[INSERT SUPPORT EMAIL]" resolves to
 * LEGAL.email, and the date replaces "Last updated: x August 2026" (the day was
 * a literal x, and August has passed). No clause was reworded or reordered.
 */
const TOC = [
  { id: "fee", label: "The ₹97 Booking Fee" },
  { id: "guarantee", label: "90–120 Day Money-Back Guarantee" },
  { id: "eligibility", label: "Eligibility Requirements" },
  { id: "target", label: "Personalised Transformation Target" },
  { id: "process", label: "Refund Request Process" },
  { id: "exclusions", label: "Where It Does Not Apply" },
  { id: "commitment", label: "Our Commitment" },
];

export default function RefundPolicy() {
  useTocActive();

  return (
    <div className="eon-policy">
      <PolicyHero
        eyebrow="Refunds · Plain English"
        title={<>REFUND <em>POLICY.</em></>}
        sub={
          <>
            What the ₹97 buys, what the guarantee covers, what you have to do to qualify, and
            exactly when it does not apply. <strong>No jargon, no padding.</strong>
          </>
        }
        metaLabel="Last updated"
        metaValue={LEGAL.effectiveDate}
      />

      <section className="legal">
        <div className="wrap">
          <div className="legal-grid">
            <PolicyToc items={TOC} />

            <article className="legal-body">
              <p className="legal-intro">
                At <strong>{LEGAL.brand}</strong>, our goal is to help you achieve a significant
                natural physique transformation through personalised training, nutrition,
                progression and accountability. We stand behind our programme with a{" "}
                <strong>100% Money-Back Guarantee</strong> because we are confident in the process
                when it is followed consistently and as prescribed.
              </p>

              <section className="legal-section" id="fee">
                <h2>The ₹97 Booking Fee</h2>
                <p>
                  The ₹97 paid on this website is a one-time booking fee for your initial 1:1
                  Physique Transformation Strategy Call with Sandesh.
                </p>
                <p>Because this fee secures and pays for the consultation, it is non-refundable.</p>
                <p>
                  The ₹97 booking fee is separate from the Extreme or Nothing Programme, which you
                  may choose to enrol into after the call and which carries its own Money-Back
                  Guarantee as set out below.
                </p>
              </section>

              <section className="legal-section" id="guarantee">
                <h2>90–120 Day Money-Back Guarantee</h2>
                <p>
                  Before beginning the programme, your current physique, body composition, training
                  history and goals will be assessed and a specific, measurable transformation
                  target will be agreed upon with you.
                </p>
                <p>If you enrol into the Extreme or Nothing Programme and:</p>
                <ul className="l-list">
                  <li>Complete your full agreed 90–120 day transformation period,</li>
                  <li>Follow your personalised training and nutrition protocol as instructed,</li>
                  <li>Meet all programme participation and progress-tracking requirements, and</li>
                  <li>
                    Do not achieve the transformation target agreed and documented at the beginning
                    of your programme,
                  </li>
                </ul>
                <p>we will refund 100% of your programme investment.</p>
              </section>

              <section className="legal-section" id="eligibility">
                <h2>Eligibility Requirements</h2>
                <p>To qualify for the Money-Back Guarantee, you must:</p>
                <ul className="l-list">
                  <li>Complete your prescribed training sessions and follow the training plan provided.</li>
                  <li>Follow your personalised calorie, macro and nutrition targets throughout the programme.</li>
                  <li>
                    Complete all scheduled check-ins and submit requested weight, measurements,
                    progress photos and training data on time.
                  </li>
                  <li>Implement the training, nutrition and other programme adjustments provided by your coach.</li>
                  <li>Complete the entire agreed 90–120 day programme from your official start date.</li>
                </ul>
                <p>
                  The guarantee is intended for clients who actively and consistently execute their
                  personalised protocol. If the agreed plan or participation requirements are not
                  followed, the guarantee will not apply.
                </p>
              </section>

              <section className="legal-section" id="target">
                <h2>Personalised Transformation Target</h2>
                <p>
                  Every client enters the programme with a different body-fat percentage, muscle
                  mass, training history and starting physique. For this reason, the exact
                  transformation outcome covered by the guarantee may differ between clients.
                </p>
                <p>
                  Your measurable transformation target will be established and documented before
                  you enrol, based on your assessment, starting point and agreed goal.
                </p>
                <p>
                  This agreed outcome, rather than a universal body-fat or weight-loss target, will
                  form the basis of your Money-Back Guarantee.
                </p>
              </section>

              <section className="legal-section" id="process">
                <h2>Refund Request Process</h2>
                <p>
                  If you believe you qualify for a refund, you must submit your request within 3
                  days of completing your agreed programme period at:
                </p>
                <p>
                  <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
                </p>
                <p>
                  Your request will be reviewed alongside your programme records, progress data and
                  agreed starting target to confirm that all eligibility requirements have been met.
                </p>
                <p>
                  Once approved, refunds will be processed within 7–14 business days using the
                  original payment method wherever possible.
                </p>
              </section>

              <section className="legal-section" id="exclusions">
                <h2>Situations Where The Guarantee Does Not Apply</h2>
                <p>The Money-Back Guarantee will not apply if:</p>
                <ul className="l-list">
                  <li>Prescribed training sessions were repeatedly missed or not completed as instructed.</li>
                  <li>Nutrition or macro targets were not followed consistently.</li>
                  <li>
                    Required check-ins, progress photos, measurements, weight or training data were
                    not submitted on time.
                  </li>
                  <li>Coaching recommendations or programme adjustments were not implemented.</li>
                  <li>The programme was discontinued before the agreed completion date.</li>
                  <li>Required information needed to assess adherence or progress was not provided.</li>
                  <li>The refund request is submitted outside the 3-day refund request window.</li>
                  <li>
                    You voluntarily pause, suspend or interrupt the programme for travel, holidays,
                    work, personal circumstances or any other reason.
                  </li>
                </ul>
                <p>
                  Any voluntary pause or interruption to the agreed programme period will make the
                  Money-Back Guarantee void.
                </p>
              </section>

              <section className="legal-section" id="commitment">
                <h2>Our Commitment</h2>
                <p>
                  Extreme or Nothing is built around a simple principle: exceptional physique
                  results require an exceptional standard of execution.
                </p>
                <p>
                  We will provide the personalised training, nutrition, progression, adjustments and
                  accountability required to pursue the transformation agreed at the beginning of
                  your programme.
                </p>
                <p>
                  In return, we expect you to execute the protocol consistently for the full
                  transformation period.
                </p>
                <p>
                  <strong>You bring the commitment. We stand behind the process.</strong>
                </p>
              </section>
            </article>
          </div>
        </div>
      </section>

      <PolicyContactCTA
        heading={<>Think you <em>qualify?</em></>}
        body="Send your request within 3 days of completing your agreed programme period and we will review it against your programme records."
      />
      <SiteFooter />
    </div>
  );
}
