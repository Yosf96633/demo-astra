import Hero from "@/components/Hero";
import About from "@/components/About";
import Features from "@/components/Features";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#concept">
        Skip to content
      </a>
      <Hero />
      <About />
      <Features />
      <CTA />
    </main>
  );
}
