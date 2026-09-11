"use client";

import { useState } from "react";
import { ArrowUpRight, Pause, Play, Activity } from "lucide-react";
import DeepSpaceVisual from "./DeepSpaceVisual";
import Reveal from "./Reveal";
import useMotionPreference from "./useMotionPreference";

export default function NeutronStarSection() {
  const [paused, setPaused] = useState(false);
  const reduced = useMotionPreference();
  return (
    <section
      id="neutron-star"
      className="neutron-section"
      aria-labelledby="neutron-heading"
    >
      <Reveal className="neutron-heading page-width">
        <div className="eyebrow section-label">
          <span className="status-light" />
          05 / THE LAST LIGHT
        </div>
        <h2 id="neutron-heading">
          An ending.
          <br />
          <span>A new kind of light.</span>
        </h2>
        <p>
          A stellar remnant. A luminous heartbeat.
          <br />
          Meet the neutron star, wrapped in a restless dance of magnetic light.
        </p>
      </Reveal>
      <div
        className="neutron-observation"
        role="img"
        aria-label="An animated neutron star with a white-pink core, rotating blue magnetic loops, and opposing violet polar beams"
      >
        <DeepSpaceVisual kind="neutron" paused={paused || reduced} />
        <div className="neutron-coordinate eyebrow">
          NEUTRON STAR<span>AN ARTIST’S IMPRESSION</span>
        </div>
        <div className="neutron-signal eyebrow">
          <Activity size={18} strokeWidth={1} />
          <span>A SIGNAL THROUGH THE DARK</span>
        </div>
      </div>
      <div className="neutron-bottom page-width">
        <a href="#transmission" className="observation-link">
          THE JOURNEY CONTINUES <ArrowUpRight size={17} />
        </a>
        <button
          className="observation-motion"
          onClick={() => setPaused(!paused)}
          disabled={reduced}
          aria-pressed={paused || reduced}
          aria-label={
            paused
              ? "Resume neutron star animation"
              : "Pause neutron star animation"
          }
        >
          {paused || reduced ? <Play size={13} /> : <Pause size={13} />}
          {reduced
            ? "STILL OBSERVATION"
            : paused
              ? "RESUME MOTION"
              : "PAUSE MOTION"}
        </button>
      </div>
    </section>
  );
}
