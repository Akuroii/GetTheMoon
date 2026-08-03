"use client";

import NumberFlow from "@number-flow/react";
import clsx from "clsx";

// The one primitive in this folder that has to be a Client Component —
// NumberFlow animates digit transitions on value change, which needs state.
// Everything else in components/ui stays server-rendered by default.
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <NumberFlow
      value={value}
      className={clsx("font-[var(--font-data)] tabular-nums", className)}
      transformTiming={{ duration: 900, easing: "var(--ease-standard)" }}
    />
  );
}
