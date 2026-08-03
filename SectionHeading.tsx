import { type ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-dim)]">
        {children}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-[var(--line)]" />
    </div>
  );
}
