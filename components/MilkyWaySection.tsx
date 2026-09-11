"use client";

import { useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import DeepSpaceVisual from "./DeepSpaceVisual";
import Reveal from "./Reveal";
import useMotionPreference from "./useMotionPreference";

export default function MilkyWaySection() {
  const [paused, setPaused] = useState(false);
  const reduced = useMotionPreference();
  return (
    <section
      id="milky-way"
      className="galaxy-section page-width"
      aria-labelledby="galaxy-heading"
    >
      <Reveal className="galaxy-heading">
        <div className="eyebrow section-label">
          04 / OUR PLACE IN THE COSMOS
        </div>
        <h2 id="galaxy-heading">
          A billion lights.
          <br />
          <span>One place called home.</span>
        </h2>
        <p>
          Follow the spiral. Somewhere in this quiet dance of starlight, there
          is us.
        </p>
      </Reveal>
      <div className="galaxy-observation">
        <DeepSpaceVisual kind="galaxy" paused={paused || reduced} />
        <div className="galaxy-coordinate eyebrow">
          THE MILKY WAY <span>AN ARTIST’S IMPRESSION</span>
        </div>
        <span className="galaxy-reticle galaxy-reticle-left" aria-hidden="true">
          +
        </span>
        <span
          className="galaxy-reticle galaxy-reticle-right"
          aria-hidden="true"
        >
          +
        </span>
        <button
          className="observation-motion galaxy-motion"
          onClick={() => setPaused(!paused)}
          disabled={reduced}
          aria-pressed={paused || reduced}
          aria-label={
            paused ? "Resume galaxy rotation" : "Pause galaxy rotation"
          }
        >
          {paused || reduced ? <Play size={13} /> : <Pause size={13} />}{" "}
          {reduced
            ? "STILL OBSERVATION"
            : paused
              ? "RESUME ORBIT"
              : "PAUSE ORBIT"}
        </button>
      </div>
      <Reveal className="galaxy-note">
        <span className="eyebrow">
          <span className="status-light" /> A SMALL PART OF SOMETHING INFINITE
        </span>
        <a href="#transmission" className="observation-link">
          STAY IN ORBIT <ArrowUpRight size={17} />
        </a>
      </Reveal>
    </section>
  );
}
