"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const DeepSpaceScene = dynamic(() => import("./scene/DeepSpaceScene"), {
  ssr: false,
});

class ObservationBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function DeepSpaceVisual({
  kind,
  paused,
}: {
  kind: "nebula" | "galaxy";
  paused: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabActive, setTabActive] = useState(true);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          preload.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    const visibility = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    const tab = () => setTabActive(!document.hidden);
    tab();
    preload.observe(node);
    visibility.observe(node);
    document.addEventListener("visibilitychange", tab);
    return () => {
      preload.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", tab);
    };
  }, []);
  const running = visible && tabActive && !paused;
  return (
    <div
      ref={root}
      className={`deep-space-visual ${kind}-visual`}
      data-running={running}
      aria-hidden="true"
    >
      <div className="deep-space-poster" />
      {near && !failed && (
        <div className="deep-space-canvas">
          <ObservationBoundary>
            <DeepSpaceScene
              kind={kind}
              running={running}
              onFailure={onFailure}
            />
          </ObservationBoundary>
        </div>
      )}
      <div className="cosmic-dust">
        {Array.from({ length: 38 }, (_, i) => (
          <i
            key={i}
            style={
              {
                left: `${(i * 37.71 + 11) % 100}%`,
                top: `${(i * 23.17 + 9) % 100}%`,
                "--dust-size": `${i % 9 === 0 ? 3 : 1 + (i % 3) * 0.4}px`,
                "--dust-duration": `${18 + (i % 7) * 4}s`,
                "--dust-delay": `${-i * 2.3}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      {kind === "nebula" && (
        <div className="meteor-field">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}
