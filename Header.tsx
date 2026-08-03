import { Pill } from "@/components/ui";

export function Header({ isLive = false }: { isLive?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ background: "var(--violet)", boxShadow: "0 0 6px var(--violet)" }}
          />
          <span className="text-sm font-medium tracking-wide">
            GET<span className="text-[var(--violet)]">THE</span>MOON
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLive && (
            <Pill tone="live" className="py-1">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-[var(--pink)]"
              />
              LIVE
            </Pill>
          )}
          {/*
            Static for now, deliberately not a button — real EN/AR string
            swapping and RTL layout are Phase 2, not this pass. A clickable
            control that does nothing on click is worse than an honest
            label.
          */}
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--text-dim)]">
            EN
          </span>
        </div>
      </div>
    </header>
  );
}
