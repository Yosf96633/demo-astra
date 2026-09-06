"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { fragmentShader, vertexShader } from "./scene/shaders";

function Singularity({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const motion = useRef({ x: 0, y: 0, scroll: 0 });
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
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
    if (!reducedMotion) u.uTime.value += Math.min(delta, 0.05);
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

function WebGLFallback({ onFailure }: { onFailure: () => void }) {
  useEffect(() => {
    onFailure();
  }, [onFailure]);
  return null;
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

  return (
    <div ref={wrapper} className="h-full w-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={lowPower ? 0.8 : [1, 1.25]}
        frameloop={visible && !reducedMotion ? "always" : "demand"}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x08090b, 0);
          gl.domElement.addEventListener("webglcontextlost", onFailure, {
            once: true,
          });
          onReady();
        }}
        fallback={<WebGLFallback onFailure={onFailure} />}
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
      </Canvas>
    </div>
  );
}
