import { type ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const glassPanel = cva(
  "rounded-2xl border backdrop-blur-[var(--glass-blur)] transition-colors duration-[var(--duration-standard)]",
  {
    variants: {
      intensity: {
        subtle: "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        strong: "bg-[rgba(13,13,31,0.75)] border-[rgba(124,111,238,0.28)]",
      },
      glow: {
        none: "",
        violet: "shadow-[0_0_40px_-12px_rgba(124,111,238,0.35)]",
        gold: "shadow-[0_0_40px_-12px_rgba(245,196,83,0.35)]",
      },
    },
    defaultVariants: {
      intensity: "subtle",
      glow: "none",
    },
  }
);

interface GlassPanelProps
  extends VariantProps<typeof glassPanel>,
    ComponentPropsWithoutRef<"div"> {}

// No "use client" — this is pure presentation, no state or handlers.
// Keeping it a Server Component means every card/panel built on top of it
// ships zero extra client JS by default.
//
// ...rest spreads onto the element for the same reason Pill does: no
// current caller needs it, but this is the exact pattern that silently
// dropped Pill's aria-live prop until it was fixed — hardening
// preventatively rather than waiting for the next one to actually bite.
export function GlassPanel({ children, className, intensity, glow, ...rest }: GlassPanelProps) {
  return (
    <div className={clsx(glassPanel({ intensity, glow }), className)} {...rest}>
      {children}
    </div>
  );
}
