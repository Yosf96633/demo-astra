"use client";
import { useState } from "react";
import {
  Orbit,
  ScanEye,
  Sparkles,
  Plus,
  Minus,
  ArrowUpRight,
} from "lucide-react";
import Reveal from "./Reveal";
const features = [
  {
    number: "01",
    icon: Orbit,
    title: "Gravity. Reimagined.",
    text: "Witness the invisible force that shapes galaxies, bends light, and rewrites the rules.",
    detail:
      "Move your cursor across the observation above. The disk shifts subtly in perspective while starlight stretches around the dark center — a visual interpretation of gravitational lensing.",
    tag: "FEEL THE PULL",
    className: "orbit-art",
  },
  {
    number: "02",
    icon: ScanEye,
    title: "A new perspective.",
    text: "Look beyond the familiar. Discover a universe far stranger, and more beautiful, than you imagined.",
    detail:
      "The glowing arc above the black hole represents the far side of the accretion disk. Gravity bends its light toward the observer, letting you glimpse what lies behind the darkness.",
    tag: "CHANGE YOUR VIEW",
    className: "lens-art",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Limitless curiosity.",
    text: "Some questions lead to answers. The best ones take you somewhere entirely new.",
    detail:
      "What happens at the center? How does information escape? Black holes sit where our understanding of gravity meets quantum physics — and where the next great questions begin.",
    tag: "KEEP EXPLORING",
    className: "stars-art",
  },
];
export default function Features() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <section id="discover" className="features-section page-width">
      <Reveal className="features-header">
        <div>
          <div className="eyebrow section-label">02 / THE DISCOVERY</div>
          <h2>
            Let the unknown <span>pull you in.</span>
          </h2>
        </div>
        <p>
          Less ordinary.
          <br />
          More extraordinary.
        </p>
      </Reveal>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {features.map((feature, i) => (
          <Reveal
            key={feature.number}
            delay={i * 0.12}
            className="feature-card"
          >
            <div className="feature-top">
              <feature.icon size={22} strokeWidth={1.3} />
              <span>{feature.number}</span>
            </div>
            <div
              className={`feature-art ${feature.className}`}
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
              <i />
              <span />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
            <button
              className="feature-button"
              aria-expanded={expanded === i}
              aria-controls={`feature-detail-${i}`}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span>{feature.tag}</span>
              {expanded === i ? <Minus size={15} /> : <Plus size={15} />}
            </button>
            <div
              id={`feature-detail-${i}`}
              hidden={expanded !== i}
              className="feature-detail"
            >
              {feature.detail}
              <a href="#home">
                Return to observation <ArrowUpRight size={12} />
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
