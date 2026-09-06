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
  uniform int uSteps;
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
    float worldAngle = atan(hit.z, hit.x);
    // The inner gas completes an orbit in roughly 30 seconds; the outer gas
    // trails behind. Prominent spiral lanes make the slow rotation readable.
    float orbit = uTime * 0.27 * pow(3.0 / r, 1.35);
    float angle = worldAngle - orbit;
    vec3 flow = vec3(r * 3.8, cos(angle) * 4.5, sin(angle) * 4.5);
    float clouds = noise(flow) * 0.58;
    clouds += noise(flow * 2.03 + 11.0) * 0.28;
    clouds += noise(flow * 4.11 + 29.0) * 0.14;
    float stream = sin(r * 18.0 + clouds * 7.0 + sin(angle * 3.0) * 1.6);
    float filaments = pow(stream * 0.5 + 0.5, 3.0);
    float spiral = pow(0.5 + 0.5 * sin(angle * 2.0 + r * 1.55), 7.0);
    float hotKnot = pow(0.5 + 0.5 * cos(angle - r * 0.28), 24.0);
    hotKnot *= exp(-pow((r - 4.6) / 1.4, 2.0));
    float gas = 0.15 + clouds * clouds * 1.8 + filaments * 0.75;
    gas += spiral * 0.5 + hotKnot * 1.7;
    float inner = smoothstep(2.9, 3.5, r);
    float outer = 1.0 - smoothstep(7.3, 12.5, r);
    float heat = pow(3.0 / max(r, 3.0), 1.35);
    // Beaming is fixed in world space; the luminous gas knots move through it.
    float beaming = 1.0 + 0.48 * sin(worldAngle);
    vec3 temperature = mix(vec3(1.0, 0.18, 0.025), vec3(1.0, 0.72, 0.35), heat);
    temperature = mix(temperature, vec3(1.0, 0.91, 0.72), clamp(hotKnot * 0.4 + filaments * heat * 0.3, 0.0, 0.8));
    float alpha = inner * outer * 0.96;
    return vec4(temperature * gas * heat * beaming * 3.15, alpha);
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
    float elevation = 0.25 + sin(uTime * 0.075) * 0.065 + uPointer.y * 0.045;
    float distanceToHole = 15.2 + uScroll * 0.65;
    vec3 origin = vec3(sin(azimuth) * cos(elevation), sin(elevation), cos(azimuth) * cos(elevation)) * distanceToHole;
    vec3 forward = normalize(-origin);
    vec3 right = normalize(cross(forward, vec3(0,1,0)));
    vec3 up = cross(right, forward);
    float roll = -0.16 + sin(uTime * 0.055) * 0.045;
    p = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * p;
    vec3 direction = normalize(forward * 2.12 + right * p.x + up * p.y);
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

    for (int i = 0; i < uSteps; i++) {
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
      float dust = exp(-abs(position.y) * 2.3)
        * exp(-max(radial - 3.0, 0.0) * 0.48)
        * smoothstep(2.7, 3.5, radial);
      color += vec3(1.0, 0.37, 0.095) * dust * stepSize * transmission * 0.11;
      position = next;
      traveled += stepSize;
      if (transmission < 0.025) break;
    }

    // Captured rays terminate at an opaque, completely dark event horizon.
    // Escaping rays sample the stars using their bent outgoing direction.
    if (!captured) color += stars(normalize(velocity)) * transmission;
    // A narrow golden photon ring gives the shadow a crisp edge, with a
    // broader, dimmer halo suggesting light lingering near the critical orbit.
    float impact = sqrt(angularMomentumSq);
    float photonRing = exp(-abs(impact - 2.598) * 32.0);
    float photonHalo = exp(-abs(impact - 2.598) * 5.5);
    color += vec3(1.0, 0.60, 0.22) * (photonRing * 0.8 + photonHalo * 0.055);
    color = vec3(1.0) - exp(-color * 1.3);
    color = pow(color, vec3(0.92));
    float fade = smoothstep(0.0, 0.16, vUv.y) * smoothstep(0.0, 0.16, 1.0 - vUv.y);
    gl_FragColor = vec4(color, fade);
  }
`;
