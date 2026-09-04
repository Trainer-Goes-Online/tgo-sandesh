import SdpReveal from "@/components/SdpReveal";
import AnnouncementBar from "@/components/AnnouncementBar";
import TrustStrip from "@/components/TrustStrip";
import Hero from "@/components/Hero";
import ForYouIf from "@/components/ForYouIf";
import CreatorRails from "@/components/CreatorRails";
import BeforeAfterTrack from "@/components/BeforeAfterTrack";
import VideoTestimonials from "@/components/VideoTestimonials";
import Founder from "@/components/Founder";
import FounderStory from "@/components/FounderStory";
import Included from "@/components/Included";
import Guarantee from "@/components/Guarantee";
import Faq from "@/components/Faq";
import Finale from "@/components/Finale";
import StickyCta from "@/components/StickyCta";

/* Sandesh Soans: Extreme or Nothing Protocol. VSL landing page.
   The 13-beat VSL blueprint on the SDP component system, re-themed IVORY x
   CHARCOAL x COPPER.

   Band rhythm, ivory unless named:
     hero (with the VSL as a CHARCOAL block inside it) · for-you-if ·
     CHARCOAL (the protocol's own product identity, closing on the
     you-need-not-be-an-athlete turn) · STONE
     (transformations) · video proof · CHARCOAL (founder authority) · story ·
     STONE (programme) · CHARCOAL (guarantee) · FAQ · CHARCOAL (close).

   The guarantee is a copper-ruled certification panel on charcoal. Ivory was
   tried there and read flat, and there was a second reason: the whole beat,
   including its terms ledger, is written in dark-band tokens, so on a light
   band most of it rendered ivory-on-ivory. If it is ever moved to a light band
   again, those tokens have to move with it.

   Beat 6 (mechanism) and beat 9 (two choices) are absent: neither exists in the
   source copy and neither was invented. See funnel-copy/01-landing-vsl.md.

   The colophon's legal links are live now that the three policy routes exist. */
export default function Home() {
  return (
    <div className="sdp-root">
      <AnnouncementBar />
      <TrustStrip />
      <main>
        <Hero />
        <ForYouIf />
        <CreatorRails />
        <BeforeAfterTrack />
        <VideoTestimonials />
        <Founder />
        <FounderStory />
        <Included />
        <Guarantee />
        <Faq />
        <Finale
          links={[
            { label: "Privacy Policy", href: "/privacy-policy" },
            { label: "Terms & Conditions", href: "/terms-and-conditions" },
            { label: "Refund Policy", href: "/refund-policy" },
          ]}
        />
      </main>
      <StickyCta />
      {/* Arms reveal-on-scroll. Mount once, last. Fail-open: without it nothing hides. */}
      <SdpReveal />
    </div>
  );
}
