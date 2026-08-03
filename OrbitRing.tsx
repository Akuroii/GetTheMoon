import clsx from "clsx";

export function OrbitRing({
  sizePercent,
  className,
}: {
  /** Diameter as a percentage of the AvatarOrbit container. */
  sizePercent: number;
  className?: string;
}) {
  const offset = (100 - sizePercent) / 2;
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "pointer-events-none absolute rounded-full border border-[var(--line)]",
        className
      )}
      style={{
        width: `${sizePercent}%`,
        height: `${sizePercent}%`,
        top: `${offset}%`,
        left: `${offset}%`,
        // Fades out toward the bottom instead of closing into a full circle —
        // the system stays open on the side facing the Journey rail below it,
        // rather than reading as a sealed, self-contained widget.
        maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 92%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 55%, transparent 92%)",
      }}
    />
  );
}
