"use client";
import useMotionPreference from "./useMotionPreference";

import dynamic from "next/dynamic";
import { Component, useCallback, useState, type ReactNode } from "react";

const BlackHoleScene = dynamic(() => import("./BlackHoleScene"), {
  ssr: false,
  loading: () => null,
});

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SceneLoader({ paused }: { paused: boolean }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reduced = useMotionPreference();
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  return (
    <div
      className="black-hole-scene"
      role="img"
      aria-label="An animated black hole with a golden accretion disk and gravitationally distorted starlight"
    >
      <div
        className={`scene-poster ${ready && !failed ? "scene-poster-hidden" : ""}`}
      />
      {!failed && (
        <SceneBoundary onFailure={onFailure}>
          <BlackHoleScene
            reducedMotion={!!reduced || paused}
            onReady={onReady}
            onFailure={onFailure}
          />
        </SceneBoundary>
      )}
      {!ready && !failed && (
        <span className="scene-loading">
          ESTABLISHING OBSERVATION <span className="loading-dot">· · ·</span>
        </span>
      )}
    </div>
  );
}
