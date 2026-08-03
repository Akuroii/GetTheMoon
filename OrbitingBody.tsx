export interface OrbitingBodyProps {
  color: string;
  /** Orbit radius as a percentage of the container — converted to cqi so it scales with the container, not the viewport. */
  radiusPercent: number;
  size: number;
  /** Seconds per full revolution. */
  duration: number;
  /** Starting position on the orbit, in degrees. */
  startAngle: number;
}

export function OrbitingBody({
  color,
  radiusPercent,
  size,
  duration,
  startAngle,
}: OrbitingBodyProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        animation: `orbit-spin ${duration}s linear infinite`,
        // A negative delay starts the loop already partway through —
        // this is what sets each body's initial position on its ring
        // without a separate transform.
        animationDelay: `${-(startAngle / 360) * duration}s`,
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          transform: `translateX(${radiusPercent}cqi)`,
          background: color,
          boxShadow: `0 0 ${size * 2.5}px ${color}`,
        }}
      />
    </div>
  );
}
