import { Nebula } from "./Nebula";
import { Starfield } from "./Starfield";
import { ShootingStar } from "./ShootingStar";

// Entirely decorative — this layer must never be reachable by keyboard or
// announced by a screen reader. Each child marks itself aria-hidden too,
// but the base layer does it here as the outermost guarantee.
export function Atmosphere() {
  return (
    <div aria-hidden="true">
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[var(--bg)]" />
      <Nebula />
      <Starfield />
      <ShootingStar />
    </div>
  );
}
