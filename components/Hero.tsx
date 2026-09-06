"use client";
import useMotionPreference from "./useMotionPreference";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  AudioLines,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import Navigation from "./Navigation";
import SceneLoader from "./SceneLoader";

export default function Hero() {
  const reduced = useMotionPreference();
  const [paused, setPaused] = useState(false);
  return (
    <section id="home" className="hero">
      <Navigation />
      <div className="hero-stars" aria-hidden="true" />
      <SceneLoader paused={paused} />
      <div className="hero-intro relative z-10 text-center">
        <motion.div
          className="eyebrow hero-eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <span className="status-light" /> A JOURNEY TO THE EDGE OF POSSIBILITY
        </motion.div>
        <motion.h1
          initial={{
            opacity: 0,
            filter: reduced ? "blur(0px)" : "blur(10px)",
            y: reduced ? 0 : 15,
          }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 1.3, delay: 0.15 }}
        >
          Beyond the <span>known.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
        >
          Where light bends. Time dissolves.
          <br className="mobile-break" /> And discovery begins.
        </motion.p>
      </div>
      <div className="scene-coordinate coordinate-left">
        <Plus size={14} />
        <span>
          OBJECT: EH–01
          <br />
          <span className="text-dim">SUPERMASSIVE BLACK HOLE</span>
        </span>
      </div>
      <div className="scene-coordinate coordinate-right">
        <span>
          23h 14m 06.2s
          <br />
          <span className="text-dim">− 08° 42′ 31.0″</span>
        </span>
        <Plus size={14} />
      </div>
      <div className="hero-action relative z-10 flex flex-col items-center">
        <a href="#concept" className="button-primary">
          Explore the unknown <ArrowUpRight size={17} />
        </a>
        <span className="action-caption">A NEW PERSPECTIVE AWAITS</span>
      </div>
      <div className="hero-bottom page-width">
        <a href="#concept" className="scroll-cue">
          <span className="scroll-icon">
            <ArrowDown size={14} />
          </span>
          SCROLL TO DISCOVER
        </a>
        <div className="observation-status">
          <span className="status-light" /> LIVE FROM THE EDGE
        </div>
        <button
          className="motion-toggle"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Play scene animation" : "Pause scene animation"}
          aria-pressed={paused}
        >
          <AudioLines size={17} />
          <span>{paused ? "MOTION PAUSED" : "COSMIC MOTION"}</span>
          {paused ? <Play size={11} /> : <Pause size={11} />}
        </button>
      </div>
      <div className="hero-data page-width">
        <span>AN INDEPENDENT EXPLORATION OF THE EXTRAORDINARY</span>
        <div>
          <span>EST. 2026</span>
          <span className="data-separator" />
          <span>
            EARTH, SOL SYSTEM <span className="tiny-cross">✳</span>
          </span>
        </div>
      </div>
    </section>
  );
}
