"use client";

import PolicyHero from "@/components/policy/PolicyHero";
import PolicyToc from "@/components/policy/PolicyToc";
import PolicyContactCTA from "@/components/policy/PolicyContactCTA";
import SiteFooter from "@/components/SiteFooter";
import { useTocActive } from "@/components/policy/useTocActive";
import { LEGAL } from "@/app/_legal/legal";

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
  { id: "who", label: "Who We Are" },
  { id: "collect", label: "What We Collect" },
  { id: "why", label: "Why We Use It" },
  { id: "share", label: "Who We Share With" },
  { id: "health", label: "Health Information" },
  { id: "retain", label: "How Long We Keep It" },
  { id: "rights", label: "Your Rights" },
  { id: "cookies", label: "Cookies" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes and Contact" },
];

export default function PrivacyPolicy() {
  useTocActive();

  return (
    <div className="eon-policy">
      <PolicyHero
        eyebrow="Privacy · Plain English"
        title={<>PRIVACY <em>POLICY.</em></>}
        sub={
          <>
            What we collect, why we collect it, how long we keep it, and exactly what control you have. <strong>No jargon, no padding.</strong>
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
                This policy explains what <strong>{LEGAL.entity}</strong> collects when you use this website or book a strategy call, why we collect it, and what you can ask us to do with it.
              </p>

              <section className="legal-section" id="who">
                <h2>Who We Are</h2>
      <p>
        This website is operated by {LEGAL.entity}, {LEGAL.address}. You can reach us at{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> or{" "}
        <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>.
      </p>
              </section>

              <section className="legal-section" id="collect">
                <h2>What We Collect</h2>
      <ul className="l-list">
        <li>
          <strong>What you give us.</strong> Your name, email address and phone number when you
          book a strategy call, and anything you tell us about your training, nutrition, health and
          goals during that call or the programme that may follow.
        </li>
        <li>
          <strong>Payment details.</strong> Card and UPI details are entered with our payment
          processor, Razorpay, and are handled by them. We never see or store your full card
          number.
        </li>
        <li>
          <strong>Usage data.</strong> Pages viewed, approximate location, device and browser, and
          how you arrived, collected through cookies and similar technologies.
        </li>
      </ul>
              </section>

              <section className="legal-section" id="why">
                <h2>Why We Use It</h2>
      <ul className="l-list">
        <li>To deliver the call and the coaching you have paid for.</li>
        <li>To take payment and to keep the records tax law requires us to keep.</li>
        <li>To contact you about your booking, your programme and your progress.</li>
        <li>To understand which advertising works, and to improve this website.</li>
      </ul>
              </section>

              <section className="legal-section" id="share">
                <h2>Who We Share It With</h2>
      <p>
        We do not sell your personal information. We share it only with the services that make this
        site work: Razorpay for payments, and analytics and advertising platforms including Google
        Analytics and Meta, which receive usage data and, for advertising measurement, an encoded
        form of your contact details. Each processes that data under its own policy.
      </p>
              </section>

              <section className="legal-section" id="health">
                <h2>Health Information</h2>
      <p>
        Coaching requires information about your body, training and health. We treat it as
        confidential, use it only to build and adjust your programme, and do not share it with
        anyone outside the coaching team without your consent, unless we are legally required to.
      </p>
              </section>

              <section className="legal-section" id="retain">
                <h2>How Long We Keep It</h2>
      <p>
        For as long as you are a client, and afterwards for as long as tax, accounting and legal
        obligations require. After that it is deleted or anonymised.
      </p>
              </section>

              <section className="legal-section" id="rights">
                <h2>Your Rights</h2>
      <p>
        You can ask us for a copy of the personal information we hold about you, ask us to correct
        it, or ask us to delete it. Write to{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we will respond within the period
        the law allows. Deleting information we need to run your programme may mean we can no
        longer deliver it.
      </p>
              </section>

              <section className="legal-section" id="cookies">
                <h2>Cookies</h2>
      <p>
        This site uses cookies to keep it working, to measure traffic and to measure advertising.
        You can block or delete cookies in your browser settings; parts of the site may stop
        working if you do.
      </p>
              </section>

              <section className="legal-section" id="children">
                <h2>Children</h2>
      <p>
        This programme is not intended for anyone under 18, and we do not knowingly collect
        information from children.
      </p>
              </section>

              <section className="legal-section" id="changes">
                <h2>Changes and Contact</h2>
      <p>
        We may update this policy. The date at the top of this page is when it last changed. Any
        question about it goes to <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
              </section>
            </article>
          </div>
        </div>
      </section>

      <PolicyContactCTA heading={<>Want your <em>data?</em></>} body="Ask us for a copy, a correction or a deletion and we will respond within the period the law allows." />
      <SiteFooter />
    </div>
  );
}
