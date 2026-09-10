import type { CSSProperties } from "react";

// Deterministic positions keep the server and browser markup identical.
const stars = Array.from({ length: 115 }, (_, index) => ({
  x: ((index * 73.137 + 9.43) % 100).toFixed(3),
  y: ((index * index * 11.731 + index * 3.17 + 4.2) % 100).toFixed(3),
  size: index % 13 === 0 ? 1.7 : index % 4 === 0 ? 1.2 : 0.85,
  opacity: 0.2 + ((index * 7) % 9) * 0.065,
}));

export default function Starfield() {
  return (
    <div className="space-starfield" aria-hidden="true">
      {stars.map((star, index) => (
        <i
          key={index}
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              "--star-opacity": star.opacity,
              animationDelay: `${-(index % 17)}s`,
              animationDuration: `${7 + (index % 9)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
