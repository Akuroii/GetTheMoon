import { type ReactNode } from "react";
import clsx from "clsx";

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-dim)]",
        className
      )}
    >
      {children}
    </p>
  );
}
