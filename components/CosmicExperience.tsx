"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useScroll } from "framer-motion";
import Hero from "./Hero";
import About from "./About";
import SceneLoader from "./SceneLoader";
import useMotionPreference from "./useMotionPreference";

export default function CosmicExperience() {
  const container = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useMotionPreference();
  const x = useMotionValue(0);
  const y = useMotionValue(260);
  const scale = useMotionValue(1);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  useLayoutEffect(() => {
    const root = container.current;
    const stage = scene.current;
    const hero = root?.querySelector<HTMLElement>("#home");
    const destination = root?.querySelector<HTMLElement>(
      "[data-orbit-destination]",
    );
    if (!root || !stage || !hero || !destination) return;

    let startCenter = 0;
    let endCenter = 0;
    let horizontalTravel = 0;
    let sceneHeight = 650;
    let finalScale = 0.6;

    const update = () => {
      const progress = reducedMotion
        ? 0
        : Math.min(1, Math.max(0, (scrollYProgress.get() - 0.04) / 0.9));
      const eased = progress * progress * (3 - 2 * progress);
      x.set(horizontalTravel * eased);
      y.set(startCenter + (endCenter - startCenter) * eased - sceneHeight / 2);
      scale.set(1 + (finalScale - 1) * eased);
    };

    const measure = () => {
      // Measure the untransformed destination, so the animation never feeds
      // its own transformed bounds back into the next frame's position.
      const bounds = root.getBoundingClientRect();
      const target = destination.getBoundingClientRect();
      sceneHeight = stage.offsetHeight;
      startCenter = hero.offsetHeight / 2 + (window.innerWidth < 768 ? 67 : 87);
      endCenter = target.top - bounds.top + target.height / 2;
      horizontalTravel =
        target.left - bounds.left + target.width / 2 - bounds.width / 2;
      finalScale = Math.min(
        0.72,
        Math.max(0.4, target.width / (sceneHeight * 1.3)),
      );
      update();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(hero);
    observer.observe(destination);
    const unsubscribe = scrollYProgress.on("change", update);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer.disconnect();
      unsubscribe();
      window.removeEventListener("resize", measure);
    };
  }, [reducedMotion, scrollYProgress, x, y, scale]);

  return (
    <div ref={container} className="cosmic-experience">
      <motion.div
        ref={scene}
        className="traveling-scene"
        style={{ x, y, scale }}
      >
        <SceneLoader paused={paused} />
      </motion.div>
      <Hero
        paused={paused}
        onToggleMotion={() => setPaused((value) => !value)}
      />
      <About />
    </div>
  );
}
