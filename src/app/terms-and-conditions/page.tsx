"use client";

import PolicyHero from "@/components/policy/PolicyHero";
import PolicyToc from "@/components/policy/PolicyToc";
import PolicyContactCTA from "@/components/policy/PolicyContactCTA";
import SiteFooter from "@/components/SiteFooter";
import { useTocActive } from "@/components/policy/useTocActive";
import { LEGAL, PRICE, inr } from "@/app/_legal/legal";

/**
 * ⚠️ DRAFTED, NOT SUPPLIED. Atul gave the entity details for these pages but not
 * the policy text, and Razorpay's merchant review will not pass without it. This
 * is written from what the funnel actually does and invents no practice the site
 * does not perform, but it needs a read by whoever signs off legal for
 * TRANSFORMMEBRO PVT LTD. before launch.
 *
 * Structure is the live SDP funnel's, beat for beat.
 */
const TOC = [
  { id: "who", label: "Who You Contract With" },
  { id: "what", label: "What You Are Buying" },
  { id: "booking", label: "Booking and Attendance" },
  { id: "payment", label: "Payment" },
  { id: "refunds", label: "Refunds" },
  { id: "results", label: "Results" },
  { id: "health", label: "Health Disclaimer" },
  { id: "yours", label: "Your Responsibilities" },
  { id: "material", label: "Our Material" },
  { id: "conduct", label: "Conduct" },
  { id: "liability", label: "Liability" },
  { id: "law", label: "Governing Law" },
  { id: "changes", label: "Changes" },
];

export default function TermsAndConditions() {
  useTocActive();

  return (
    <div className="eon-policy">
      <PolicyHero
        eyebrow="Terms · Plain English"
        title={<>TERMS &amp; <em>CONDITIONS.</em></>}
        sub={
          <>
            What the booking fee buys, what happens after the call, and the limits on both sides. <strong>No jargon, no padding.</strong>
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
                These terms govern your purchase of the <strong>{LEGAL.product}</strong> from <strong>{LEGAL.entity}</strong> and any coaching that follows it. By paying the booking fee you accept them.
              </p>

              <section className="legal-section" id="who">
                <h2>Who You Are Contracting With</h2>
      <p>
        {LEGAL.entity}, {LEGAL.address}. Contact:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>,{" "}
        <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>.
      </p>
              </section>

              <section className="legal-section" id="what">
                <h2>What You Are Buying</h2>
      <p>
        {inr(PRICE.amount)} buys a one-time booking fee for a 1:1 Physique Transformation Strategy
        Call with Sandesh. It is a consultation, not the Extreme or Nothing Programme. The
        programme is a separate enrolment offered after the call, on its own terms and its own
        price, and you are under no obligation to take it.
      </p>
              </section>

              <section className="legal-section" id="booking">
                <h2>Booking and Attendance</h2>
      <p>
        You will be asked to select a call time after payment. Please attend at the time booked. If
        you cannot, tell us in advance and we will reschedule you once where a slot is available. A
        call missed without notice is treated as delivered.
      </p>
              </section>

              <section className="legal-section" id="payment">
                <h2>Payment</h2>
      <p>
        Payment is taken in Indian Rupees through Razorpay. Prices shown include applicable taxes
        unless stated otherwise. We reserve the right to change our prices at any time; the price
        shown when you pay is the price that applies to you.
      </p>
              </section>

              <section className="legal-section" id="refunds">
                <h2>Refunds</h2>
      <p>
        The {inr(PRICE.amount)} booking fee is non-refundable, because it pays for the consultation
        it secures. The Extreme or Nothing Programme carries its own 100% Money-Back Guarantee. The
        full terms of both, including eligibility and the request process, are set out in our
        Refund Policy, which forms part of these terms.
      </p>
              </section>

              <section className="legal-section" id="results">
                <h2>Results, and What We Do Not Promise</h2>
      <p>
        Physique results depend on your starting point, your genetics, your health, and above all
        on how consistently you execute the protocol. Nothing on this website is a guarantee that
        you will achieve any particular outcome. Where a transformation target is guaranteed, it is
        the specific target agreed and documented with you before you enrol, on the terms in the
        Refund Policy.
      </p>
              </section>

              <section className="legal-section" id="health">
                <h2>Health and Medical Disclaimer</h2>
      <p>
        Sandesh is a coach, not a doctor, and nothing provided is medical advice, diagnosis or
        treatment. Consult a qualified medical professional before starting any training or
        nutrition programme, particularly if you have an existing condition, an injury, or are
        taking medication. You participate at your own risk, and you are responsible for telling us
        about anything that affects your ability to train or eat as prescribed.
      </p>
              </section>

              <section className="legal-section" id="yours">
                <h2>Your Responsibilities</h2>
      <p>
        You agree to give accurate information about your health, training and nutrition, to follow
        the protocol as prescribed, and to submit the check-ins and progress data the programme
        requires. Coaching cannot work on inaccurate information, and the guarantee depends on
        these being met.
      </p>
              </section>

              <section className="legal-section" id="material">
                <h2>Our Material</h2>
      <p>
        Every plan, protocol, video and document we provide belongs to {LEGAL.entity} and is
        licensed to you for your own personal use. Do not copy, resell, publish or share it.
      </p>
              </section>

              <section className="legal-section" id="conduct">
                <h2>Conduct</h2>
      <p>
        We may end a coaching relationship without refund if a client is abusive to the coaching
        team, or shares our material in breach of the clause above.
      </p>
              </section>

              <section className="legal-section" id="liability">
                <h2>Liability</h2>
      <p>
        To the extent the law allows, our total liability to you is limited to the amount you have
        paid us. We are not liable for indirect or consequential loss. Nothing here limits
        liability that cannot lawfully be limited.
      </p>
              </section>

              <section className="legal-section" id="law">
                <h2>Governing Law</h2>
      <p>
        These terms are governed by the laws of India, and the courts of {LEGAL.jurisdiction} have
        exclusive jurisdiction over any dispute.
      </p>
              </section>

              <section className="legal-section" id="changes">
                <h2>Changes</h2>
      <p>
        We may update these terms. The version in force is the one published here on the day you
        pay. The date at the top of this page is when it last changed.
      </p>
              </section>
            </article>
          </div>
        </div>
      </section>

      <PolicyContactCTA heading={<>Something <em>unclear?</em></>} body="Ask before you pay rather than after. We would rather answer the question than argue about it later." />
      <SiteFooter />
    </div>
  );
}
