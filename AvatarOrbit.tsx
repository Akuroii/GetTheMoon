import Image from "next/image";
import { OrbitRing } from "./OrbitRing";
import { OrbitingBody, type OrbitingBodyProps } from "./OrbitingBody";
import { GravityParticles } from "./GravityParticles";

const RINGS = [42, 62, 84]; // diameter, % of container — one per orbiting body

const BODIES: OrbitingBodyProps[] = [
  { color: "var(--violet)", radiusPercent: 21, size: 7, duration: 46, startAngle: 15 },
  { color: "var(--pink)", radiusPercent: 31, size: 6, duration: 68, startAngle: 170 },
  { color: "var(--gold)", radiusPercent: 42, size: 5, duration: 94, startAngle: 290 },
];

export function AvatarOrbit({
  avatarSrc,
  avatarAlt,
}: {
  avatarSrc: string | null;
  avatarAlt: string;
}) {
  return (
    <div
      className="relative mx-auto aspect-square w-56 md:w-72"
      style={{ containerType: "inline-size" }}
    >
      {/* Nebula haze — scoped to the avatar's own footprint, not the full
          ring system. A single very slow opacity breathe; nothing else
          in this component animates its own scale or brightness, per the
          "no heavy glow" direction. */}
      <div
        aria-hidden="true"
        className="absolute inset-[18%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(124,111,238,0.35), rgba(255,94,168,0.15) 60%, transparent 75%)",
          animation: "nebula-breathe 14s ease-in-out infinite",
        }}
      />

      <div aria-hidden="true">
        {RINGS.map((size) => (
          <OrbitRing key={size} sizePercent={size} />
        ))}
      </div>

      <GravityParticles />

      <div aria-hidden="true">
        {BODIES.map((b) => (
          <OrbitingBody key={b.color} {...b} />
        ))}
      </div>

      {/* The avatar is the one thing in this component that does not move.
          Everything above orbits it; it stays still — that's what makes it
          read as the gravity source rather than one more moving element. */}
      <div className="absolute inset-[18%] overflow-hidden rounded-full ring-1 ring-[var(--line)]">
        {avatarSrc ? (
          <Image src={avatarSrc} alt={avatarAlt} fill className="object-cover" priority />
        ) : (
          // Before the first ingestion run has ever completed, there's no
          // synced avatar yet — a plain gradient circle rather than a
          // broken image, same idiom as the Moon's own CSS-built surface.
          <div
            role="img"
            aria-label={avatarAlt}
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, var(--violet), var(--surface) 70%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
