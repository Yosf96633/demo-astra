"use client";

import { useEffect } from "react";
import { cancelFrame, frame } from "framer-motion";
import Lenis from "lenis";
import useMotionPreference from "./useMotionPreference";

export default function SmoothScroll() {
  const reducedMotion = useMotionPreference();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.075,
      smoothWheel: true,
      syncTouch: false,
      anchors: { offset: -35, duration: 1.3 },
      prevent: (node) => Boolean(node.closest("dialog")),
    });

    // Lenis and the section reveals share Motion's clock. Native scroll
    // positions stay in sync with the traveling scene, including anchor links.
    const update = ({ timestamp }: { timestamp: number }) =>
      lenis.raf(timestamp);
    frame.update(update, true);
    return () => {
      cancelFrame(update);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
