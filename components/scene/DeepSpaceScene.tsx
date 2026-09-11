"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei/core/Texture";
import * as THREE from "three";
import {
  galaxyShader,
  nebulaShader,
  screenVertexShader,
} from "./deep-space-shaders";
import { neutronStarShader } from "./neutron-star-shaders";
import NeutronStarField from "./NeutronStarField";

type Kind = "nebula" | "galaxy" | "neutron";

function Observation({
  kind,
  running,
  texture,
}: {
  kind: Kind;
  running: boolean;
  texture?: THREE.Texture;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { size, invalidate } = useThree();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uImage: { value: texture ?? null },
      uImageAspect: { value: 1800 / 1877 },
      uPointer: { value: new THREE.Vector2() },
    }),
    [texture],
  );

  useEffect(() => {
    if (material.current) {
      material.current.uniforms.uAspect.value =
        size.width / Math.max(1, size.height);
    }
    invalidate();
  }, [size, invalidate]);

  useFrame(({ pointer }, delta) => {
    if (!material.current) return;
    // R3F can copy uniform values when applying material props. Update the
    // attached material, so resize and time always reach the rendered shader.
    const live = material.current.uniforms;
    live.uAspect.value = size.width / Math.max(1, size.height);
    if (running && delta < 1) live.uTime.value += delta;
    const follow = running ? 1 - Math.exp(-Math.min(delta, 0.1) * 2) : 0;
    live.uPointer.value.lerp(pointer, follow);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={screenVertexShader}
        fragmentShader={
          kind === "nebula"
            ? nebulaShader
            : kind === "neutron"
              ? neutronStarShader
              : galaxyShader
        }
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Nebula({ running }: { running: boolean }) {
  const texture = useTexture("/nebula-pillars.webp");
  return <Observation kind="nebula" running={running} texture={texture} />;
}

export default function DeepSpaceScene({
  kind,
  running,
  onFailure,
}: {
  kind: Kind;
  running: boolean;
  onFailure: () => void;
}) {
  const [lowPower] = useState(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    return (
      window.innerWidth < 768 ||
      navigator.hardwareConcurrency <= 4 ||
      (nav.deviceMemory ?? 8) <= 4
    );
  });
  return (
    <Canvas
      dpr={lowPower ? 0.85 : [1, 1.5]}
      frameloop={running ? "always" : "demand"}
      resize={{ scroll: false, offsetSize: true }}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", onFailure, {
          once: true,
        });
      }}
      fallback={<span />}
    >
      <Suspense fallback={null}>
        {kind === "nebula" ? (
          <Nebula running={running} />
        ) : (
          <Observation kind={kind} running={running} />
        )}
        {kind === "neutron" && (
          <NeutronStarField running={running} lowPower={lowPower} />
        )}
      </Suspense>
    </Canvas>
  );
}
