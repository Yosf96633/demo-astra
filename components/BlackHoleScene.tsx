"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei/core/AdaptiveDpr";
import { PerformanceMonitor } from "@react-three/drei/core/PerformanceMonitor";
import { Stars } from "@react-three/drei/core/Stars";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { fragmentShader, vertexShader } from "./scene/shaders";
import SpectralOptics from "./scene/SpectralOptics";

function Singularity({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const motion = useRef({ x: 0, y: 0, scroll: 0 });
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSteps: { value: 72 },
      uAspect: { value: 1 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
    }),
    [],
  );

  useEffect(() => {
    if (reducedMotion) return;
    const move = (e: PointerEvent) => {
      motion.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      motion.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    const scroll = () => {
      motion.current.scroll = Math.min(window.scrollY / window.innerHeight, 2);
    };
    scroll();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll);
    };
  }, [reducedMotion]);

  useFrame((state, delta) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    // Keep orbital speed consistent even on a slower GPU. Ignore long gaps
    // when the tab or offscreen canvas resumes.
    if (!reducedMotion && delta < 1) u.uTime.value += delta;
    u.uAspect.value = viewport.width / viewport.height;
    const damping = 1 - Math.exp(-delta * 2);
    u.uPointer.value.x = THREE.MathUtils.lerp(
      u.uPointer.value.x,
      motion.current.x,
      damping,
    );
    u.uPointer.value.y = THREE.MathUtils.lerp(
      u.uPointer.value.y,
      motion.current.y,
      damping,
    );
    u.uScroll.value = THREE.MathUtils.lerp(
      u.uScroll.value,
      motion.current.scroll,
      damping,
    );
    // Camera drift adds parallax to the separate world-space star field.
    if (!reducedMotion) {
      state.camera.position.x =
        Math.sin(state.clock.elapsedTime * 0.06) * 0.018;
      state.camera.position.y = motion.current.scroll * 0.025;
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function BlackHoleScene({
  reducedMotion,
  onReady,
  onFailure,
}: {
  reducedMotion: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const [lowPower, setLowPower] = useState(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    return (
      window.innerWidth < 768 ||
      navigator.hardwareConcurrency <= 4 ||
      (nav.deviceMemory ?? 8) <= 4
    );
  });
  const [visible, setVisible] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting && !document.hidden),
    );
    if (wrapper.current) observer.observe(wrapper.current);
    const visibility = () =>
      setVisible(
        !document.hidden &&
          !!wrapper.current &&
          wrapper.current.getBoundingClientRect().bottom > 0,
      );
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  // Layout measurements avoid scaling the canvas buffer twice as its parent
  // travels into the observation window.
  return (
    <div ref={wrapper} className="h-full w-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={lowPower ? 0.8 : [1, 1.25]}
        resize={{ scroll: false, offsetSize: true }}
        frameloop={visible && !reducedMotion ? "always" : "demand"}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x08090b, 0);
          gl.domElement.addEventListener("webglcontextlost", onFailure, {
            once: true,
          });
          onReady();
        }}
        fallback={
          <span>Your browser does not support the animated observation.</span>
        }
      >
        <Stars
          radius={35}
          depth={35}
          count={lowPower ? 160 : 650}
          factor={1.5}
          saturation={0}
          fade
          speed={reducedMotion ? 0 : 0.12}
        />
        <Singularity reducedMotion={reducedMotion} />
        <PerformanceMonitor
          onDecline={() => setLowPower(true)}
          onFallback={() => setLowPower(true)}
          flipflops={1}
        />
        <AdaptiveDpr />
        <SpectralOptics lowPower={lowPower} />
      </Canvas>
    </div>
  );
}
