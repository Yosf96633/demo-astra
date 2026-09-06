export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform float uScroll;
  uniform vec2 uPointer;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  vec4 accretion(vec3 hit) {
    float r = length(hit.xz);
    // The gas follows differential rotation: faster at the inner edge,
    // slower farther out. Circular noise coordinates keep the orbit seamless.
    float angle = atan(hit.z, hit.x) - uTime * 0.19 * pow(3.0 / r, 1.5);
    vec3 flow = vec3(r * 2.4, cos(angle) * 3.0, sin(angle) * 3.0);
    float clouds = noise(flow);
    clouds += noise(flow * 2.07 + 11.0) * 0.5;
    clouds += noise(flow * 4.13 + 29.0) * 0.25;
    float wisps = sin(r * 23.0 + clouds * 4.5) * 0.5 + 0.5;
    float gas = 0.48 + clouds * 0.44 + wisps * 0.18;
    float inner = smoothstep(2.9, 3.6, r);
    float outer = 1.0 - smoothstep(7.0, 12.5, r);
    float heat = pow(3.0 / max(r, 3.0), 1.5);
    // The approaching half is brighter and warmer, suggesting Doppler beaming.
    float beaming = 1.0 + 0.38 * sin(angle + uTime * 0.19 * pow(3.0 / r, 1.5));
    vec3 temperature = mix(vec3(1.0, 0.29, 0.055), vec3(1.0, 0.84, 0.58), heat);
    float alpha = inner * outer * 0.94;
    return vec4(temperature * gas * heat * beaming * 2.15, alpha);
  }

  vec3 stars(vec3 direction) {
    vec3 cells = direction * 360.0;
    vec3 id = floor(cells);
    vec3 offset = fract(cells) - 0.5;
    float seed = hash(id);
    float point = exp(-dot(offset, offset) * 110.0) * step(0.996, seed);
    return vec3(0.30, 0.34, 0.40) * point;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
    p.y += uScroll * 0.045;
    // A slow orbital camera makes the disk breathe in perspective rather than
    // rotating the entire image like a flat graphic.
    float azimuth = uTime * 0.016 + uPointer.x * 0.07;
    float elevation = 0.19 + sin(uTime * 0.045) * 0.035 + uPointer.y * 0.025;
    float distanceToHole = 18.5 + uScroll * 0.65;
    vec3 origin = vec3(sin(azimuth) * cos(elevation), sin(elevation), cos(azimuth) * cos(elevation)) * distanceToHole;
    vec3 forward = normalize(-origin);
    vec3 right = normalize(cross(forward, vec3(0,1,0)));
    vec3 up = cross(right, forward);
    float roll = -0.11 + sin(uTime * 0.028) * 0.025;
    p = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * p;
    vec3 direction = normalize(forward * 1.95 + right * p.x + up * p.y);
    vec3 position = origin;
    vec3 velocity = direction;
    vec3 color = vec3(0.0);
    float transmission = 1.0;

    // Trace the light ray through a central gravitational field. In units where
    // the Schwarzschild radius is 1, the ray equation is approximately
    // d²x/ds² = -1.5 * |x × v|² * x / |x|⁵. The conserved angular momentum
    // controls how strongly the ray curves. Rays near the critical impact
    // parameter wrap around the hole and reveal the far side of the disk above
    // and below it: the characteristic gravitationally lensed arcs.
    vec3 angularMomentum = cross(position, velocity);
    float angularMomentumSq = dot(angularMomentum, angularMomentum);
    bool captured = false;
    float traveled = 0.0;

    for (int i = 0; i < 88; i++) {
      float r = length(position);
      if (r < 1.015) { captured = true; break; }
      if (r > 26.0 || traveled > 80.0) break;

      // Shorter steps near the photon sphere preserve the ring; the empty
      // outer region uses larger steps so most pixels finish very quickly.
      float stepSize = clamp(r * 0.13, 0.065, 2.1);
      vec3 acceleration = -1.5 * angularMomentumSq * position / pow(r, 5.0);
      vec3 next = position + velocity * stepSize + acceleration * stepSize * stepSize * 0.5;
      vec3 nextAcceleration = -1.5 * angularMomentumSq * next / pow(max(length(next), 0.5), 5.0);
      velocity += (acceleration + nextAcceleration) * stepSize * 0.5;

      // Intersect the ray segment with the physical disk plane. A bent ray can
      // cross more than once, naturally creating secondary images of the disk.
      if (position.y * next.y < 0.0) {
        float crossing = position.y / (position.y - next.y);
        vec3 hit = mix(position, next, crossing);
        float diskRadius = length(hit.xz);
        if (diskRadius > 2.9 && diskRadius < 12.5) {
          vec4 disk = accretion(hit);
          color += disk.rgb * disk.a * transmission;
          transmission *= 1.0 - disk.a;
        }
      }

      // A thin atmosphere of hot gas adds a soft volumetric glow around the
      // disk, instead of a hard, uniformly illuminated torus.
      float radial = length(position.xz);
      float dust = exp(-abs(position.y) * 3.2)
        * exp(-max(radial - 3.0, 0.0) * 0.48)
        * smoothstep(2.7, 3.5, radial);
      color += vec3(1.0, 0.37, 0.095) * dust * stepSize * transmission * 0.065;
      position = next;
      traveled += stepSize;
      if (transmission < 0.025) break;
    }

    // Captured rays terminate at an opaque, completely dark event horizon.
    // Escaping rays sample the stars using their bent outgoing direction.
    if (!captured) color += stars(normalize(velocity)) * transmission;
    color = vec3(1.0) - exp(-color * 1.3);
    color = pow(color, vec3(0.92));
    float fade = smoothstep(0.0, 0.16, vUv.y) * smoothstep(0.0, 0.16, 1.0 - vUv.y);
    gl_FragColor = vec4(color, fade);
  }
`;
