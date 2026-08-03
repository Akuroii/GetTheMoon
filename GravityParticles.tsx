interface Particle {
  angle: number; // degrees, starting position on the outer circle
  delay: number; // seconds
  duration: number; // seconds
}

// Five, deliberately sparse — this is meant to read as an occasional detail,
// not an ambient particle field. Different angle/delay/duration per particle
// so they never move in visible sync with each other.
const PARTICLES: Particle[] = [
  { angle: 15, delay: 0, duration: 9 },
  { angle: 95, delay: 3, duration: 11 },
  { angle: 160, delay: 6.5, duration: 8 },
  { angle: 230, delay: 1.5, duration: 10 },
  { angle: 300, delay: 5, duration: 9.5 },
];

export function GravityParticles() {
  return (
    <div aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[3px] w-[3px] rounded-full bg-[var(--text)]"
          style={
            {
              "--gravity-angle": `${p.angle}deg`,
              animation: `gravity-pull ${p.duration}s ease-in ${p.delay}s infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
