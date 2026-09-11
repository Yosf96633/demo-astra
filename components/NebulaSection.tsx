"use client";

import { useState } from "react";
import { ArrowDownRight, Pause, Play } from "lucide-react";
import DeepSpaceVisual from "./DeepSpaceVisual";
import Reveal from "./Reveal";
import useMotionPreference from "./useMotionPreference";

export default function NebulaSection() {
  const [paused, setPaused] = useState(false);
  const reduced = useMotionPreference();
  return (
    <section
      id="nebula"
      className="nebula-section"
      aria-labelledby="nebula-heading"
    >
      <div className="nebula-observation">
        <DeepSpaceVisual kind="nebula" paused={paused || reduced} />
      </div>
      <div className="nebula-shade" aria-hidden="true" />
      <div className="page-width nebula-layout">
        <Reveal className="nebula-copy">
          <div className="eyebrow section-label">
            <span className="status-light" />
            03 / THE STELLAR NURSERY
          </div>
          <h2 id="nebula-heading">
            Even stars
            <br />
            have a <em>beginning.</em>
          </h2>
          <p>
            Before the light, there is a cloud.
            <br />
            Step into the Pillars of Creation, where towering veils of dust hold
            the promise of something new.
          </p>
          <a href="#milky-way" className="observation-link">
            FOLLOW THE STARLIGHT <ArrowDownRight size={18} />
          </a>
        </Reveal>
        <div className="nebula-coordinate eyebrow">
          M 16 <span /> EAGLE NEBULA
        </div>
        <div className="observation-bottom">
          <div className="observation-caption">
            <span className="status-light" />
            <span>
              PILLARS OF CREATION
              <br />
              <small>AN OBSERVATION IN VISIBLE LIGHT</small>
            </span>
          </div>
          <button
            className="observation-motion"
            onClick={() => setPaused(!paused)}
            disabled={reduced}
            aria-pressed={paused || reduced}
            aria-label={
              paused ? "Resume nebula animation" : "Pause nebula animation"
            }
          >
            {paused || reduced ? <Play size={13} /> : <Pause size={13} />}{" "}
            {reduced
              ? "STILL OBSERVATION"
              : paused
                ? "RESUME MOTION"
                : "PAUSE MOTION"}
          </button>
        </div>
      </div>
      <p className="nebula-credit">
        <a
          href="https://esahubble.org/images/heic1501a/"
          target="_blank"
          rel="noreferrer"
        >
          Image: NASA, ESA/Hubble and the Hubble Heritage Team
        </a>{" "}
        · Animated interpretation
      </p>
    </section>
  );
}
