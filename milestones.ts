// Single source of truth for the current chapter's milestone configuration.
// Imported by both the page (client-visible progress) and the OG-image route.
// V1 kept two independent hardcoded copies of this data (index.html + api/og.js)
// and it caused a real, documented bug: NaN% on the OG card at exactly 100K.
// This file exists so that failure mode can't recur — there is nowhere else
// "100000" or "500000" should ever be typed in this codebase.

export const MILESTONE_CONFIG = {
  chapterStart: 100_000,
  chapterGoal: 500_000,
  chapterStartDate: "2026-07-22", // the day the channel crossed 100K
  subMilestones: [150_000, 200_000, 250_000, 300_000, 350_000, 400_000, 450_000, 500_000],
} as const;

/** Overall chapter progress, 0–1. Clamped so a live count past the goal never exceeds 100%. */
export function chapterProgress(currentSubscribers: number): number {
  const { chapterStart, chapterGoal } = MILESTONE_CONFIG;
  const raw = (currentSubscribers - chapterStart) / (chapterGoal - chapterStart);
  return Math.min(1, Math.max(0, raw));
}

/**
 * The next not-yet-reached sub-milestone, or the chapter goal if all are passed.
 * This is what V1 got wrong — its "Next Milestone" stat could show a number
 * lower than the current count once the real total passed the hardcoded ceiling.
 */
export function nextMilestone(currentSubscribers: number): number {
  const next = MILESTONE_CONFIG.subMilestones.find((m) => m > currentSubscribers);
  return next ?? MILESTONE_CONFIG.chapterGoal;
}

/** Which sub-milestone segment a count currently sits in — sets the carousel's default position. */
export function currentSegmentIndex(currentSubscribers: number): number {
  const idx = MILESTONE_CONFIG.subMilestones.findIndex((m) => m > currentSubscribers);
  return idx === -1 ? MILESTONE_CONFIG.subMilestones.length - 1 : idx;
}

/**
 * Start/end/percent for a given carousel segment, matching V1's
 * "‹ start → end · pct ›" readout pattern.
 */
export function segmentRange(index: number, currentSubscribers: number) {
  const { chapterStart, subMilestones } = MILESTONE_CONFIG;
  const start = index === 0 ? chapterStart : subMilestones[index - 1];
  const end = subMilestones[index];
  // Guard against start === end: this exact 0/0 division is what produced
  // V1's "NaN%" bug on the OG card. Kept as an explicit, commented guard
  // rather than trusting it won't come up again.
  const pct = start === end ? 1 : Math.min(1, Math.max(0, (currentSubscribers - start) / (end - start)));
  return { start, end, pct };
}
