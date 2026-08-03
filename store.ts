import { create } from "zustand";
import type { ChannelStats } from "./types";

interface ChannelStatsStore {
  stats: ChannelStats | null;
  setStats: (stats: ChannelStats) => void;
}

export const useChannelStatsStore = create<ChannelStatsStore>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats }),
}));
