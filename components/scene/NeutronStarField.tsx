"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createMagneticField } from "./magnetic-field-geometry";
import {
  magneticFragmentShader,
  magneticVertexShader,
} from "./neutron-star-shaders";

export default function NeutronStarField({
  running,
  lowPower,
}: {
  running: boolean;
  lowPower: boolean;
}) {
  const { size } = useThree();
  const core = useRef<THREE.ShaderMaterial>(null);
  const glow = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const data = createMagneticField(lowPower);
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(data.positions, 3),
    );
    mesh.setAttribute("aNext", new THREE.Float32BufferAttribute(data.next, 3));
    mesh.setAttribute("aSide", new THREE.Float32BufferAttribute(data.sides, 1));
    mesh.setAttribute(
      "aProgress",
      new THREE.Float32BufferAttribute(data.progress, 1),
    );
    mesh.setAttribute("aSeed", new THREE.Float32BufferAttribute(data.seeds, 1));
    mesh.setIndex(data.indices);
    return mesh;
  }, [lowPower]);
  const uniforms = useMemo(
    () =>
      [0, 1].map((uGlow) => ({
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uHeight: { value: 800 },
        uWidth: { value: uGlow ? 9.0 : 1.4 },
        uGlow: { value: uGlow },
        uPointer: { value: new THREE.Vector2() },
      })),
    [],
  );
  useEffect(() => {
    const materials = [core.current, glow.current];
    return () => {
      geometry.dispose();
      materials.forEach((material) => material?.dispose());
    };
  }, [geometry]);
  useFrame(({ pointer }, delta) => {
    for (const ref of [core, glow]) {
      if (!ref.current) continue;
      const u = ref.current.uniforms;
      u.uAspect.value = size.width / Math.max(1, size.height);
      u.uHeight.value = Math.max(1, size.height);
      if (running && delta < 1) u.uTime.value += delta;
      if (running)
        u.uPointer.value.lerp(pointer, 1 - Math.exp(-Math.min(delta, 0.1) * 2));
    }
  });
  return (
    <>
      {[1, 0].map((pass) => (
        <mesh
          key={pass}
          geometry={geometry}
          frustumCulled={false}
          renderOrder={pass ? 1 : 2}
          dispose={null}
        >
          <shaderMaterial
            ref={pass ? glow : core}
            uniforms={uniforms[pass]}
            vertexShader={magneticVertexShader}
            fragmentShader={magneticFragmentShader}
            transparent
            blending={THREE.AdditiveBlending}
            depthTest={false}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}
