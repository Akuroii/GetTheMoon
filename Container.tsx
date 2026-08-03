import { type ReactNode } from "react";
import clsx from "clsx";

const sizes = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
  narrow: "max-w-3xl",
} as const;

export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: keyof typeof sizes;
}) {
  return (
    <div className={clsx("mx-auto w-full px-6 sm:px-8", sizes[size], className)}>
      {children}
    </div>
  );
}
