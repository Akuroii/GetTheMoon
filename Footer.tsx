import { MILESTONE_CONFIG } from "@/lib/milestones";
import { formatDate } from "@/lib/format";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-8 text-center">
      <p className="text-xs text-[var(--text-dim)]">
        made with orbits and a little stardust · getthemoon
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]/70">
        Journey started at {MILESTONE_CONFIG.chapterStart.toLocaleString()} subscribers ·{" "}
        {formatDate(MILESTONE_CONFIG.chapterStartDate, "long")}
      </p>
    </footer>
  );
}
