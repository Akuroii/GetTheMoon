"use client";

import { useEffect } from "react";
import { useChannelStatsStore } from "@/lib/store";
import type { ChannelStats } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

// Renders nothing — this is a data-sync mount point, not UI. One poller,
// one shared store, so the Hero's count and the Milestone Journey's marker
// position can never drift apart from each other after the first refresh.
export function LiveStatsSync({ initialStats }: { initialStats: ChannelStats }) {
  const setStats = useChannelStatsStore((s) => s.setStats);

  useEffect(() => {
    setStats(initialStats);

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        setStats(await res.json());
      } catch {
        // Silent — the next poll, 30s later, tries again. A background
        // refresh failing once shouldn't put an error state on screen.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [initialStats, setStats]);

  return null;
}
