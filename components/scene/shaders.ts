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
    float orbit = uTime * 0.22 * pow(3.0 / r, 1.35);
    float angle = worldAngle - orbit;

    // Long, smooth gas streamlines, with small irregularities. The older high
    // frequency turbulence produced the braided / metallic appearance.
    vec3 flow = vec3(r * 0.75, cos(angle) * 4.5, sin(angle) * 4.5);
    float clouds = noise(flow) * 0.65;
    clouds += noise(flow * 2.03 + 11.0) * 0.25;
    clouds += noise(flow * 4.11 + 29.0) * 0.10;
    float wisps = noise(vec3(r * 3.5, cos(angle) * 9.0, sin(angle) * 9.0));
    float phase = r * 36.0 + clouds * 8.0 + wisps * 1.6 + sin(angle * 3.0 + r * 0.55) * 3.0;
    float thread = pow(0.5 + 0.5 * sin(phase), 3.0);
    // Outer filaments merge softly into light instead of ending in hard rings.
    thread = mix(thread, 0.45, smoothstep(5.0, 9.0, r));
    float flowDensity = 0.88 + 0.12 * sin(angle * 4.0 + r * 0.8);
    float gas = (0.12 + thread * 0.95 + clouds * 0.28) * flowDensity;
    float inner = smoothstep(2.95, 3.24, r);
    float outer = 1.0 - smoothstep(6.0, 10.7, r);
    float heat = pow(3.0 / max(r, 3.0), 1.4);

    // Equal lighting at both projected ends keeps the disk visually balanced.
    // Squaring the camera-relative cosine preserves the same emission envelope
    // on either side, while the smaller gas details continue to orbit.
    float cameraAngle = uTime * 0.009;
    float limb = pow(cos(worldAngle + cameraAngle), 2.0);
    float beaming = 1.55 + 0.35 * limb;
    // The primary light is white, as in the reference. Spectral color comes
    // from edge dispersion in the optical pass, not painted rainbow bands.
    vec3 light = mix(vec3(0.67, 0.84, 1.0), vec3(1.0), smoothstep(0.3, 0.9, heat));
    float grain = noise(vec3(r * 10.0, cos(angle) * 18.0, sin(angle) * 18.0));
    vec3 emission = light * gas * heat * beaming * 2.6 * (0.7 + grain * 0.65);
    float whiteRim = 1.0 - smoothstep(3.7, 4.8, r);
    emission += vec3(0.96, 0.99, 1.0) * whiteRim * 1.65;
    float glare = pow(limb, 3.5) * exp(-pow((r - 5.8) / 2.0, 2.0));
    emission += vec3(0.90, 0.98, 1.0) * glare * 2.4;

    // Paired warm highlights avoid a single flare extending one apparent edge.
    float knot = pow(limb, 12.0);
    knot *= exp(-pow((r - 7.3) / 0.9, 2.0));
    emission += vec3(1.0, 0.40, 0.015) * knot * 2.2;
    return vec4(emission, inner * outer * 0.985);
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
    // The DOM scene follows the scroll; the horizon retains its hero size.
    p.y += uScroll * 0.006;
    // A slow orbital camera makes the disk breathe in perspective rather than
    // rotating the entire image like a flat graphic.
    float azimuth = uTime * 0.009 + uPointer.x * 0.028;
    float elevation = 0.17 + sin(uTime * 0.035) * 0.009 + uPointer.y * 0.008;
    float distanceToHole = 15.2;
    vec3 origin = vec3(sin(azimuth) * cos(elevation), sin(elevation), cos(azimuth) * cos(elevation)) * distanceToHole;
    vec3 forward = normalize(-origin);
    vec3 right = normalize(cross(forward, vec3(0,1,0)));
    vec3 up = cross(right, forward);
    // Keep the horizontal diameter level; camera parallax must not lower one
    // end of the disk. Orbital gas motion is independent of camera roll.
    float roll = 0.0;
    p = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * p;
    vec3 direction = normalize(forward * 1.95 + right * p.x + up * p.y);
    vec3 position = origin;
    vec3 velocity = direction;
    vec3 color = vec3(0.0);
    vec3 atmosphere = vec3(0.0);
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
    int planeCrossings = 0;

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
        planeCrossings += 1;
        float crossing = position.y / (position.y - next.y);
        vec3 hit = mix(position, next, crossing);
        float diskRadius = length(hit.xz);
        if (diskRadius > 2.95 && diskRadius < 10.7) {
          vec4 disk = accretion(hit);
          // Secondary images contribute just a fine lower rim, rather than
          // the thick, fully illuminated lower ring in the previous version.
          if (planeCrossings > 1) {
            float fineRim = exp(-pow((diskRadius - 3.22) / 0.19, 2.0));
            float underside = 1.0 - smoothstep(-0.06, 0.0, p.y);
            disk.a *= fineRim * 0.9 * underside;
            disk.rgb *= 0.9;
          }
          color += disk.rgb * disk.a * transmission;
          transmission *= 1.0 - disk.a;
        }
      }

      // A thin atmosphere of hot gas adds a soft volumetric glow around the
      // disk, instead of a hard, uniformly illuminated torus.
      float radial = length(position.xz);
      float dust = exp(-abs(position.y) * 3.8)
        * exp(-max(radial - 3.0, 0.0) * 0.42)
        * smoothstep(2.95, 3.5, radial)
        * (1.0 - smoothstep(6.0, 10.7, radial));
      vec3 vapor = vec3(0.68, 0.82, 1.0);
      atmosphere += vapor * dust * stepSize * transmission * 0.11;
      position = next;
      traveled += stepSize;
      if (transmission < 0.025) break;
    }

    // Captured rays terminate at an opaque, completely dark event horizon.
    // Escaping rays sample the stars using their bent outgoing direction.
    float impact = sqrt(angularMomentumSq);
    if (!captured && impact > 3.75) color += stars(normalize(velocity)) * transmission;
    // Keep scattered vapor outside the shadow unless an emitting disk actually
    // crosses this ray. The disk then defines the silhouette without a second
    // circular mask or numerical wisps leaking into the black center.
    float diskLight = max(color.r, max(color.g, color.b));
    color += atmosphere * (impact > 3.75 ? 1.0 : smoothstep(0.01, 0.1, diskLight));
    color = vec3(1.0) - exp(-color * 1.3);
    color = pow(color, vec3(0.92));
    float fade = smoothstep(0.0, 0.16, vUv.y) * smoothstep(0.0, 0.16, 1.0 - vUv.y);
    // Let the page's tiny background stars show through empty space. Captured
    // rays remain opaque black, so stars never shine through the event horizon.
    float light = max(color.r, max(color.g, color.b));
    float coverage = (captured || impact < 3.75) ? 1.0 : clamp(max(1.0 - transmission, light * 5.0), 0.0, 1.0);
    gl_FragColor = vec4(color, fade * coverage);
  }
`;

export const opticsShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform vec2 uResolution;
  uniform float uLowPower;

  vec3 highlight(vec2 uv) {
    vec3 c = texture2D(uImage, uv).rgb;
    return c * smoothstep(0.48, 0.98, max(c.r, max(c.g, c.b)));
  }

  void main() {
    vec2 pixel = 1.0 / uResolution;
    vec2 fromCenter = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    float radius = length(fromCenter);
    vec2 direction = normalize(fromCenter + vec2(0.00001));
    // Slightly displaced wavelength samples create cyan on the inner edge,
    // red on the outer edge, and spectral ribbons in the fine streamlines.
    vec2 dispersion = direction * pixel * (1.8 + radius * 15.0);
    vec4 center = texture2D(uImage, vUv);
    vec4 red = texture2D(uImage, vUv - dispersion);
    vec4 blue = texture2D(uImage, vUv + dispersion);
    vec3 color = vec3(red.r, center.g, blue.b);

    // An anisotropic bloom follows the disk's diagonal instead of putting a
    // uniform glow around the black shadow. No glow is added inside the void.
    vec3 glow = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      if (uLowPower > 0.5 && i >= 6) break;
      float angle = float(i) * 2.39996;
      float spread = 6.0 + float(i) * 2.0;
      vec2 offset = vec2(cos(angle) * 1.7, sin(angle) * 0.7) * spread;
      glow += highlight(vUv + offset * pixel);
    }
    glow /= uLowPower > 0.5 ? 6.0 : 12.0;
    float sourceLight = max(center.r, max(center.g, center.b));
    float shadow = center.a * (1.0 - smoothstep(0.0, 0.015, sourceLight));
    float bloomMask = 1.0 - smoothstep(0.25, 0.9, sourceLight);
    color += glow * 0.75 * (1.0 - shadow) * bloomMask;
    float alpha = max(max(red.a, blue.a), center.a);
    alpha = max(alpha, max(glow.r, max(glow.g, glow.b)) * 0.65);
    gl_FragColor = vec4(color, alpha);
  }
`;
