export const neutronStarShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;

  float starHash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float stars(vec2 p, float scale, float density) {
    vec2 cell = floor(p * scale);
    vec2 center = vec2(starHash(cell + 31.0), starHash(cell - 7.0)) * 0.9 + 0.05;
    vec2 offset = fract(p * scale) - center;
    float seed = starHash(cell);
    return exp(-dot(offset, offset) * mix(50.0, 180.0, seed))
      * step(1.0 - density, seed) * (0.3 + starHash(cell + 19.0));
  }

  void main() {
    float framing = max(3.0, 2.75 / uAspect);
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * framing - uPointer * 0.025;
    float tilt = 0.32 + sin(uTime * 0.09) * 0.015;
    vec2 axis = mat2(cos(tilt), sin(tilt), -sin(tilt), cos(tilt)) * p;
    float radius = length(p);
    // A slow, low-amplitude pulse keeps the visual luminous without strobing.
    float pulse = 0.96 + 0.04 * sin(uTime * 1.3);
    vec3 color = vec3(0.012, 0.011, 0.035);
    color += vec3(0.12, 0.055, 0.24) * exp(-radius * radius * 0.5);
    color += vec3(0.20, 0.12, 0.54) * exp(-radius * radius * 1.35);
    color += vec3(0.04, 0.13, 0.3) * exp(-radius * radius * 0.8);
    color += vec3(0.25, 0.11, 0.88) * exp(-dot(axis / vec2(0.85, 1.05), axis / vec2(0.85, 1.05)) * 1.7);

    // Opposing polar beams widen very slightly away from the star. A bright
    // spine, violet sheath and broader scattering glow give each beam depth.
    float distanceAlongAxis = abs(axis.y);
    float width = 0.013 + distanceAlongAxis * 0.016;
    float spine = exp(-pow(axis.x / width, 2.0));
    float sheath = exp(-pow(axis.x / (width * 3.6), 2.0));
    float beamFade = exp(-distanceAlongAxis * 0.55);
    float stream = 0.85 + 0.15 * sin(distanceAlongAxis * 15.0 - uTime * 1.8);
    color += vec3(0.46, 0.12, 1.0) * sheath * beamFade * 0.62;
    float beamEdges = exp(-pow((abs(axis.x) - width * 1.6) / (width * 0.3), 2.0));
    color += vec3(0.35, 0.18, 0.85) * beamEdges * beamFade * 0.3;
    color += mix(vec3(1.0, 0.43, 0.86), vec3(0.38, 0.20, 1.0), smoothstep(0.18, 0.9, distanceAlongAxis))
      * spine * beamFade * stream * 2.1;

    // Magenta corona and white nucleus, with soft photographic diffraction.
    color += vec3(1.0, 0.19, 0.66) * exp(-radius * radius * 13.0) * 2.0 * pulse;
    color += vec3(1.0, 0.52, 0.85) * exp(-radius * radius * 60.0) * 2.7 * pulse;
    float core = 1.0 - smoothstep(0.064, 0.089, radius);
    color += vec3(1.0, 0.96, 1.0) * core * 7.0;
    float crossFlare = exp(-abs(axis.y) * 210.0) * exp(-abs(axis.x) * 4.8);
    color += vec3(0.6, 0.75, 1.0) * crossFlare * 0.65;
    float poleGlow = exp(-dot(vec2(axis.x, abs(axis.y) - 0.49), vec2(axis.x, abs(axis.y) - 0.49)) * 260.0);
    color += vec3(0.18, 0.66, 1.0) * poleGlow * 1.4;

    // Unaligned, sparse star layers avoid the dotted-grid look.
    vec2 field = mat2(0.8, -0.6, 0.6, 0.8) * p + 11.7;
    float points = stars(p + 3.9, 24.3, 0.035) + stars(field, 47.1, 0.025) * 0.5;
    color += vec3(0.78, 0.85, 1.0) * points * 1.5;
    color = 1.0 - exp(-color * 1.05);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const magneticVertexShader = /* glsl */ `
  attribute vec3 aNext;
  attribute float aSide;
  attribute float aProgress;
  attribute float aSeed;
  uniform float uTime;
  uniform float uAspect;
  uniform float uHeight;
  uniform float uWidth;
  uniform vec2 uPointer;
  varying float vSide;
  varying float vStrength;

  vec3 orbit(vec3 p) {
    float spin = uTime * 0.085;
    p.xz = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * p.xz;
    // Project a little depth into the vertical axis to separate the front and
    // back magnetic meridians; all loops share the same two polar endpoints.
    p.y += p.z * 0.16;
    float tilt = 0.32 + sin(uTime * 0.09) * 0.015;
    p.xy = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * p.xy;
    return p;
  }
  void main() {
    float framing = max(3.0, 2.75 / uAspect);
    vec3 point = orbit(position);
    vec3 next = orbit(aNext);
    vec2 tangent = normalize(next.xy - point.xy + vec2(0.000001));
    vec2 normal = vec2(-tangent.y, tangent.x);
    // Expand each curve into a camera-facing ribbon, measured in CSS pixels.
    // Soft ribbon edges provide glow without a full-screen bloom pass.
    point.xy += normal * aSide * uWidth * framing / uHeight;
    point.xy += uPointer * 0.025;
    gl_Position = vec4(point.xy / vec2(uAspect, 1.0) * 2.0 / framing, 0.0, 1.0);
    vSide = aSide;
    float depth = smoothstep(-1.0, 1.0, point.z);
    float flow = 0.72 + 0.28 * pow(0.5 + 0.5 * sin(aProgress * 9.0 - uTime * 0.9 + aSeed * 6.283), 3.0);
    float poleFade = smoothstep(0.0, 0.035, aProgress) * (1.0 - smoothstep(0.965, 1.0, aProgress));
    vStrength = (0.12 + depth * 0.76) * flow * poleFade;
  }
`;

export const magneticFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uGlow;
  varying float vSide;
  varying float vStrength;
  void main() {
    float softness = pow(max(0.0, 1.0 - abs(vSide)), 2.0);
    vec3 color = mix(vec3(0.4, 0.83, 1.0), vec3(0.13, 0.43, 1.0), uGlow);
    float alpha = softness * vStrength * mix(0.9, 0.12, uGlow);
    gl_FragColor = vec4(color, alpha);
  }
`;
