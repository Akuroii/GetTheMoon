"use client";

import { Pill } from "@/components/ui";

export function MilestoneCarousel({
  segmentIndex,
  segmentCount,
  onPrev,
  onNext,
  start,
  end,
  pct,
}: {
  segmentIndex: number;
  segmentCount: number;
  onPrev: () => void;
  onNext: () => void;
  start: number;
  end: number;
  pct: number;
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={segmentIndex === 0}
        aria-label="Focus previous milestone"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-dim)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--text)] disabled:opacity-30"
      >
        ‹
      </button>

      {/* This is the accessible source of truth for progress — the SVG path
          above is aria-hidden and decorative; a screen reader gets this
          text, not a description of the curve. */}
      <Pill tone="neutral" className="font-[var(--font-data)]" aria-live="polite">
        {start.toLocaleString()} → {end.toLocaleString()} · {(pct * 100).toFixed(1)}%
      </Pill>

      <button
        type="button"
        onClick={onNext}
        disabled={segmentIndex === segmentCount - 1}
        aria-label="Focus next milestone"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-dim)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--text)] disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}
