"use client";
import useMotionPreference from "./useMotionPreference";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import Reveal from "./Reveal";

function GravityWell() {
  return (
    <svg
      className="gravity-well"
      viewBox="0 0 560 360"
      fill="none"
      aria-label="A wireframe illustration of spacetime curving around a black hole"
      role="img"
    >
      <defs>
        <radialGradient id="wellGlow">
          <stop stopColor="#ff9c5a" stopOpacity=".18" />
          <stop offset="1" stopColor="#ff9c5a" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="gridColor"
          x1="280"
          y1="80"
          x2="280"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f4bc87" stopOpacity=".8" />
          <stop offset="1" stopColor="#75614f" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <ellipse cx="280" cy="188" rx="210" ry="140" fill="url(#wellGlow)" />
      <g stroke="url(#gridColor)" strokeWidth=".75">
        {Array.from({ length: 18 }, (_, i) => {
          const x = 50 + i * 27;
          const pull = Math.exp(-Math.pow((x - 280) / 90, 2));
          return (
            <path
              key={`v${i}`}
              d={`M ${x} 106 Q ${x + (280 - x) * 0.2} 150 ${x + (280 - x) * 0.5} ${174 + pull * 118} Q ${x + (280 - x) * 0.2} 240 ${x - (280 - x) * 0.3} 287`}
            />
          );
        })}
        {Array.from({ length: 13 }, (_, i) => {
          const y = 106 + i * 15;
          const depth = Math.exp(-Math.pow((y - 172) / 55, 2)) * 125;
          return (
            <path
              key={`h${i}`}
              d={`M 43 ${y} C 170 ${y - 10} 210 ${y} 242 ${y + depth * 0.73} Q 280 ${y + depth + 15} 318 ${y + depth * 0.73} C 350 ${y} 390 ${y - 10} 517 ${y}`}
            />
          );
        })}
      </g>
      <ellipse
        cx="280"
        cy="154"
        rx="44"
        ry="16"
        fill="#08090b"
        stroke="#dd9a62"
        strokeWidth=".9"
      />
      <ellipse
        cx="280"
        cy="154"
        rx="51"
        ry="20"
        stroke="#d1905f"
        strokeWidth=".5"
        opacity=".45"
      />
      <path
        d="M280 62V130M280 178V311"
        stroke="#bd9977"
        strokeDasharray="3 5"
        opacity=".3"
      />
      <circle cx="280" cy="62" r="2.5" fill="#f6b27f" />
      <path d="M333 156L403 101H471" stroke="#ac9078" strokeWidth=".6" />
      <text
        x="407"
        y="92"
        fill="#a39589"
        fontSize="8"
        letterSpacing="1.4"
        fontFamily="monospace"
      >
        SINGULARITY
      </text>
      <text
        x="37"
        y="330"
        fill="#776f67"
        fontSize="8"
        letterSpacing="1.3"
        fontFamily="monospace"
      >
        SPACETIME CURVATURE
      </text>
      <text
        x="452"
        y="330"
        fill="#776f67"
        fontSize="8"
        letterSpacing="1.3"
        fontFamily="monospace"
      >
        FIG. 001
      </text>
    </svg>
  );
}

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);
  const y = useTransform(scrollYProgress, [0, 1], [22, -22]);
  return (
    <section id="concept" className="concept-section page-width" ref={ref}>
      <Reveal className="concept-copy">
        <div className="eyebrow section-label">
          <span>01 / THE CONCEPT</span>
          <span className="small-line" />
        </div>
        <h2>
          At the edge of everything,
          <br />
          <span>something begins.</span>
        </h2>
        <p>
          A black hole isn’t just an ending. It’s an invitation to question
          everything we think we know.
        </p>
        <p>
          Event Horizon is a space for the endlessly curious. An exploration of
          cosmic extremes, impossible ideas, and the extraordinary beauty of the
          unknown.
        </p>
        <a className="text-link" href="#discover">
          A different kind of perspective <ArrowUpRight size={16} />
        </a>
      </Reveal>
      <Reveal className="concept-visual" delay={0.15}>
        <div className="figure-top">
          <span>
            <span className="status-light" /> THE FABRIC OF REALITY
          </span>
          <Plus size={13} />
        </div>
        <motion.div
          className="gravity-motion"
          style={reduced ? {} : { rotate, y }}
        >
          <GravityWell />
        </motion.div>
        <div className="figure-bottom">
          <span>GRAVITY CHANGES EVERYTHING.</span>
          <span>01 — 03</span>
        </div>
      </Reveal>
    </section>
  );
}
