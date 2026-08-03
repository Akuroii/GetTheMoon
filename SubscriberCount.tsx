"use client";

import { AnimatedNumber, SectionLabel } from "@/components/ui";
import { useChannelStatsStore } from "@/lib/store";
import type { ChannelStats } from "@/lib/types";
import { formatTime } from "@/lib/format";

// Falls back to the server-rendered initialStats until LiveStatsSync's
// first effect fires — avoids a flash of stale/zeroed content before the
// store hydrates.
export function SubscriberCount({ initialStats }: { initialStats: ChannelStats }) {
  const stats = useChannelStatsStore((s) => s.stats) ?? initialStats;

  return (
    <div aria-live="polite" className="text-center">
      <AnimatedNumber
        value={stats.subscriberCount}
        className="text-6xl font-medium tracking-tight sm:text-7xl md:text-8xl"
      />
      <SectionLabel className="mt-2">Subscribers</SectionLabel>
      <p className="mt-1 text-xs text-[var(--text-dim)]">updated {formatTime(stats.updatedAt)}</p>
    </div>
  );
}
