import CosmicExperience from "@/components/CosmicExperience";
import SmoothScroll from "@/components/SmoothScroll";
import Starfield from "@/components/Starfield";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import NebulaSection from "@/components/NebulaSection";
import MilkyWaySection from "@/components/MilkyWaySection";
import NeutronStarSection from "@/components/NeutronStarSection";

export default function Home() {
  return (
    <main className="landing-page">
      <SmoothScroll />
      <Starfield />
      <a className="skip-link" href="#concept">
        Skip to content
      </a>
      <CosmicExperience />
      <Features />
      <NebulaSection />
      <MilkyWaySection />
      <NeutronStarSection />
      <CTA />
    </main>
  );
}
