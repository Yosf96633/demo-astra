// An artistic dipole envelope: every meridian leaves the upper pole, curves
// out through space, and returns to the lower pole. The stars and jets remain
// separate, so rotating the field never spins the whole background.
export function createMagneticField(lowPower = false) {
  const loops = lowPower ? 28 : 48;
  const segments = lowPower ? 80 : 128;
  const positions: number[] = [];
  const next: number[] = [];
  const sides: number[] = [];
  const progress: number[] = [];
  const seeds: number[] = [];
  const indices: number[] = [];

  for (let loop = 0; loop < loops; loop++) {
    const azimuth = (loop / loops) * Math.PI * 2;
    const radius = 0.86 + 0.21 * (0.5 + 0.5 * Math.sin(loop * 2.39996));
    const point = (t: number) => {
      const theta = t * Math.PI;
      const outward = radius * Math.pow(Math.sin(theta), 1.5);
      return [
        outward * Math.cos(azimuth),
        0.49 * Math.cos(theta) + radius * 0.64 * Math.sin(2 * theta),
        outward * Math.sin(azimuth),
      ];
    };

    for (let step = 0; step <= segments; step++) {
      const t = step / segments;
      const position = point(t);
      // At the final endpoint extend the last tangent instead of normalizing
      // a zero-length segment, which otherwise makes a visible pole artifact.
      const ahead =
        step < segments
          ? point((step + 1) / segments)
          : position.map(
              (v, axis) => v * 2 - point((step - 1) / segments)[axis],
            );
      for (const side of [-1, 1]) {
        positions.push(...position);
        next.push(...ahead);
        sides.push(side);
        progress.push(t);
        seeds.push(loop / loops);
      }
      if (step < segments) {
        const index = (loop * (segments + 1) + step) * 2;
        indices.push(
          index,
          index + 1,
          index + 2,
          index + 1,
          index + 3,
          index + 2,
        );
      }
    }
  }
  return { positions, next, sides, progress, seeds, indices };
}
