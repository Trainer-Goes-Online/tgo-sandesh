import SdpReveal from "@/components/SdpReveal";
import AnnouncementBar from "@/components/AnnouncementBar";
import TrustStrip from "@/components/TrustStrip";
import Hero from "@/components/Hero";
import FoodStrip from "@/components/FoodStrip";
import RealResults from "@/components/RealResults";
import ForYouIf from "@/components/ForYouIf";
import WhyBelly from "@/components/WhyBelly";
import NammaMethod from "@/components/NammaMethod";
import Founder from "@/components/Founder";
import Included from "@/components/Included";
import Guarantee from "@/components/Guarantee";
import Faq from "@/components/Faq";
import Finale from "@/components/Finale";
import StickyCta from "@/components/StickyCta";

/* Sandesh Soans: the NAMMA Method landing page, from "Sandesh Kannada Landing Page.pdf". */
export default function Home() {
  return (
    <div className="sdp-root">
      <AnnouncementBar />
      <TrustStrip />
      <main>
        <Hero />
        <FoodStrip />
        <RealResults />
        <ForYouIf />
        <WhyBelly />
        <NammaMethod />
        <Founder />
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
