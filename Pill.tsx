import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const pill = cva(
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--surface)] border-[var(--line)] text-[var(--text-dim)]",
        live: "bg-[rgba(255,94,168,0.1)] border-[rgba(255,94,168,0.4)] text-[var(--pink)]",
        social:
          "bg-[var(--surface)] border-[var(--line)] text-[var(--text)] transition-transform duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--violet)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

interface PillProps extends VariantProps<typeof pill>, HTMLAttributes<HTMLElement> {
  href?: string;
}

// No "use client" — this is pure presentation, no state or handlers.
//
// ...rest spreads onto whichever element actually renders. Typed against
// the anchor variant's props (a superset-compatible base for this use
// case) rather than div's — spreading div-typed rest props onto the <a>
// branch doesn't type-check, since React's event handler types are
// parameterized per element and don't widen between them automatically.
export function Pill({ children, className, tone, href, ...rest }: PillProps) {
  const classes = clsx(pill({ tone }), className);
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
