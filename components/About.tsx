"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import Reveal from "./Reveal";

export default function About() {
  return (
    <section id="concept" className="concept-section page-width">
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
      <div className="concept-visual">
        <Reveal>
          <div className="figure-top">
            <span>
              <span className="status-light" /> A CLOSER OBSERVATION
            </span>
            <Plus size={13} />
          </div>
        </Reveal>
        <div
          className="orbit-destination"
          data-orbit-destination
          aria-hidden="true"
        >
          <div className="orbit-reticle" />
        </div>
        <Reveal>
          <div className="figure-bottom">
            <span>THE SAME MYSTERY. A NEW PERSPECTIVE.</span>
            <span>EH — 01</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
