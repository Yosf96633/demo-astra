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

  // A separate, well-distributed hash avoids the repeated rows produced by
  // large sine-hash coordinates in the fine stellar layers.
  float starHash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  float starLayer(vec2 p, float scale, float density) {
    vec2 cell = floor(p * scale);
    vec2 center = vec2(starHash(cell + 31.0), starHash(cell - 7.0)) * 0.9 + 0.05;
    vec2 offset = fract(p * scale) - center;
    float seed = starHash(cell);
    float size = mix(65.0, 180.0, starHash(cell + 43.0));
    return exp(-dot(offset, offset) * size) * step(1.0 - density, seed)
      * (0.45 + starHash(cell + 19.0) * 1.5);
  }

  void main() {
    float framing = max(2.5, 3.45 / uAspect);
    vec2 screen = (vUv - 0.5) * vec2(uAspect, 1.0) * framing;
    screen -= uPointer * 0.025;

    // Fix the camera at the reference's diagonal, nearly edge-on angle. Only
    // stars and gas orbit: the entire image never spins like a flat postcard.
    float tilt = 0.57;
    vec2 view = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * screen;
    vec2 p = view / vec2(1.0, 0.29);
    float radius = length(p);
    float orbit = uTime * (0.012 + 0.006 / (radius + 0.4));
    p = mat2(cos(orbit), -sin(orbit), sin(orbit), cos(orbit)) * p;
    float angle = atan(p.y, p.x);

    // Closely wound logarithmic arms sit inside a continuous stellar disk.
    // Advect the grain with the arms so the tiny stars stay in their gas lanes.
    float structure = fbm(p * 4.5);
    float grain = fbm(p * 32.0);
    float phase = angle * 2.0 - log(radius + 0.13) * 10.0;
    float arms = pow(0.5 + 0.5 * cos(phase + structure * 2.4), 3.0);
    float filaments = pow(0.5 + 0.5 * cos(phase * 3.0 + grain * 4.0), 7.0);
    float edge = 1.0 - smoothstep(1.5, 2.15, radius);
    float envelope = exp(-radius * 1.15) * edge;
    float dustLanes = pow(0.5 + 0.5 * sin(phase + 0.8 + structure * 2.4), 12.0);
    float extinction = 1.0 - dustLanes * smoothstep(0.12, 0.5, radius) * 0.76;
    float stellarDisk = (0.26 + arms * 1.7 + filaments * 0.32) * envelope;
    vec3 diskColor = mix(vec3(1.0, 0.55, 0.19), vec3(1.0, 0.84, 0.5), arms * 0.7);
    vec3 color = diskColor * stellarDisk * (0.55 + grain) * extinction * 1.65;

    // Sparse, warped star positions replace the dense dotted lattice. Different
    // orientations keep the layers from sharing visible rows or columns.
    vec2 scattered = p + vec2(noise(p * 6.0 + 14.0), noise(p * 6.0 - 9.0)) * 0.045;
    vec2 secondLayer = mat2(0.8, -0.6, 0.6, 0.8) * scattered + 4.7;
    float fineStars = starLayer(scattered, 157.3, 0.18) + starLayer(secondLayer, 291.7, 0.07) * 0.45;
    float clusters = starLayer(scattered, 63.0, 0.05);
    vec3 starlight = mix(vec3(1.0, 0.67, 0.3), vec3(1.0, 0.94, 0.73), arms);
    color += starlight * fineStars * (0.32 + arms * 2.5) * envelope * extinction;
    color += vec3(1.0, 0.93, 0.72) * clusters * (0.25 + arms) * envelope * 2.4;

    // A thicker dust envelope uses its own projected depth and slower flow.
    // Domain-warped noise gives the amber clouds broken, smoky silhouettes.
    vec2 halo = view / vec2(1.0, 0.65);
    vec2 drift = vec2(uTime * 0.008, -uTime * 0.006);
    vec2 warp = vec2(fbm(halo * 2.7 + drift), fbm(halo * 2.7 + 8.0 - drift));
    float smoke = fbm(halo * 6.5 + warp * 3.2 + drift);
    float cloudEdges = fbm(halo * 18.0 + warp * 2.0);
    float haloFalloff = exp(-dot(halo, halo) * 1.1);
    float plume = smoothstep(0.38, 0.74, smoke) * haloFalloff;
    float outsideDisk = smoothstep(0.04, 0.32, abs(view.y));
    color += vec3(0.85, 0.38, 0.1) * plume * (0.35 + cloudEdges * 0.9)
      * (0.35 + outsideDisk) * 0.7;

    // The elongated cream nucleus and rounder stellar bulge overlap, softly
    // overexposing the center while keeping visible gold detail in the arms.
    color += vec3(1.0, 0.83, 0.48) * exp(-radius * 4.8) * 4.2;
    float bulge = length(view / vec2(1.0, 0.65));
    color += vec3(1.0, 0.79, 0.42) * exp(-bulge * 8.5) * 0.8;
    color += vec3(1.0, 0.96, 0.79) * exp(-radius * radius * 30.0) * 1.4;

    // Sparse foreground stars are independent of the galactic rotation.
    float field = starLayer(screen + 7.0, 55.0, 0.06);
    color += vec3(0.86, 0.87, 0.8) * field * 0.8;

    // A small silhouetted world echoes the lower-right foreground of the
    // reference. Its thin upper rim faces the luminous galactic center.
    vec2 planetPosition = vec2(uAspect * framing * 0.30, -framing * 0.35);
    vec2 planet = (screen - planetPosition) / 0.105;
    float planetRadius = length(planet);
    float body = 1.0 - smoothstep(0.97, 1.01, planetRadius);
    vec2 lightDirection = normalize(-planetPosition);
    float crescent = pow(max(dot(normalize(planet + 0.0001), lightDirection), 0.0), 2.0);
    float rim = exp(-pow((planetRadius - 0.985) / 0.027, 2.0)) * crescent;
    color *= 1.0 - body;
    color += vec3(0.8, 0.49, 0.23) * rim * 0.65;

    color = 1.0 - exp(-color * 1.3);
    gl_FragColor = vec4(color, 1.0);
  }
`;
