export const screenVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const noiseFunctions = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
      mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float n = 0.0, amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      n += amplitude * noise(p);
      p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 17.0;
      amplitude *= 0.5;
    }
    return n;
  }
`;

export const nebulaShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform float uTime;
  uniform float uAspect;
  uniform float uImageAspect;
  uniform vec2 uPointer;
  ${noiseFunctions}
  void main() {
    // Cover the observation window without stretching the original photograph.
    vec2 fit = vec2(min(uAspect / uImageAspect, 1.0), min(uImageAspect / uAspect, 1.0));
    vec2 uv = (vUv - 0.5) * fit * 0.96 + 0.5;
    uv += uPointer * vec2(0.004, 0.003);
    vec3 original = texture2D(uImage, uv).rgb;
    // Blue gas drifts a little more than the dense brown pillars. Bright stars
    // are protected from displacement, so the image never appears to melt.
    float gasMask = smoothstep(-0.03, 0.14, original.b - original.r);
    float starMask = 1.0 - smoothstep(0.55, 0.85, max(original.r, max(original.g, original.b)));
    vec2 flow = vec2(fbm(uv * 7.0 + vec2(uTime * 0.018, 0.0)),
      fbm(uv * 7.0 + vec2(12.0, -uTime * 0.014))) - 0.5;
    vec2 displaced = uv + flow * (0.001 + gasMask * 0.008) * starMask;
    vec3 color = texture2D(uImage, displaced).rgb;
    float mist = fbm(uv * 4.0 + vec2(uTime * 0.011, -uTime * 0.007));
    color += vec3(0.07, 0.15, 0.18) * smoothstep(0.45, 0.85, mist) * gasMask * 0.28;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const galaxyShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;
  ${noiseFunctions}

  float starLayer(vec2 p, float scale, float density) {
    vec2 cell = floor(p * scale);
    vec2 center = vec2(hash(cell + 31.0), hash(cell - 7.0)) * 0.7 + 0.15;
    vec2 offset = fract(p * scale) - center;
    float seed = hash(cell);
    float size = mix(90.0, 280.0, hash(cell + 43.0));
    return exp(-dot(offset, offset) * size) * step(1.0 - density, seed)
      * (0.45 + hash(cell + 19.0) * 1.5);
  }

  void main() {
    float framing = uAspect < 1.5 ? 3.15 : 2.65;
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * framing;
    p -= uPointer * 0.025;
    // A shallow inclination reveals the disk's depth while preserving the
    // reference's broad, nearly face-on spiral silhouette.
    p.y /= 0.78;
    float radius = length(p);
    // Differential orbital motion: the inner stars move slightly faster.
    // Advect both gas and stars through the same coordinates to prevent sliding.
    float rotation = 0.3 + uTime * (0.018 + 0.008 / (radius + 0.45));
    p = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation)) * p;
    float angle = atan(p.y, p.x);
    float turbulence = fbm(p * 7.0);
    float phase = angle - log(radius + 0.16) * 3.1;
    float arms = pow(0.5 + 0.5 * cos(phase * 4.0 + turbulence * 1.8), 9.0);
    float wisps = pow(0.5 + 0.5 * cos(phase * 4.0 + 0.65 + turbulence * 3.0), 20.0);
    float envelope = smoothstep(0.09, 0.3, radius) * (1.0 - smoothstep(0.85, 1.38, radius));
    float clouds = fbm(p * 26.0);
    float lanes = smoothstep(0.3, 0.7, fbm(p * 15.0 + 3.0));
    float gas = (arms * 0.8 + wisps * 0.22) * envelope;
    vec3 color = vec3(0.17, 0.26, 0.48) * gas * (0.5 + clouds * 1.2);
    color *= 0.3 + lanes * 0.95;
    // A broad unresolved stellar disk supports thousands of discrete points.
    color += vec3(0.12, 0.16, 0.25) * exp(-radius * 3.8) * turbulence;
    float stars = starLayer(p, 220.0, 0.7) + starLayer(p, 430.0, 0.48) * 0.55;
    float clusters = starLayer(p, 74.0, 0.055);
    vec3 starColor = mix(vec3(0.52, 0.7, 1.0), vec3(1.0, 0.89, 0.67), exp(-radius * 3.5));
    color += starColor * stars * (0.15 + arms * 1.6 + wisps * 0.4) * envelope;
    color += vec3(0.68, 0.84, 1.0) * clusters * arms * envelope * 2.3;
    float coreNoise = 0.8 + starLayer(p, 320.0, 0.8) * 0.4;
    color += vec3(1.0, 0.79, 0.47) * exp(-radius * 10.0) * 3.8 * coreNoise;
    color += vec3(1.0, 0.96, 0.84) * exp(-radius * radius * 145.0) * 2.0;
    color = 1.0 - exp(-color * 1.4);
    float edge = 1.0 - smoothstep(1.2, 1.55, radius);
    gl_FragColor = vec4(color * edge, 1.0);
  }
`;
