"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useFBO } from "@react-three/drei/core/Fbo";
import * as THREE from "three";
import { opticsShader } from "./shaders";

export default function SpectralOptics({ lowPower }: { lowPower: boolean }) {
  const target = useFBO({ depthBuffer: false, type: THREE.UnsignedByteType });
  const pass = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uImage: { value: target.texture },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uLowPower: { value: 0 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: opticsShader,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    scene.add(quad);
    return { scene, camera, material, geometry };
  }, [target]);

  useEffect(
    () => () => {
      pass.geometry.dispose();
      pass.material.dispose();
    },
    [pass],
  );

  // Trace the expensive gravitational scene once, then separate wavelengths
  // and soften its highlights using inexpensive texture samples.
  useFrame(({ gl, scene, camera }) => {
    pass.material.uniforms.uResolution.value.set(target.width, target.height);
    pass.material.uniforms.uLowPower.value = lowPower ? 1 : 0;
    const previousTarget = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(previousTarget);
    gl.render(pass.scene, pass.camera);
  }, 1);

  return null;
}
