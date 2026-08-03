import { getChannelStats, getContentItems } from "@/lib/data";
import { LiveStatsSync } from "@/components/data/LiveStatsSync";
import { Hero } from "@/components/hero/Hero";
import { MilestoneJourney } from "@/components/milestone/MilestoneJourney";
import { ContentTimeline } from "@/components/timeline/ContentTimeline";
import { StatsRow } from "@/components/stats/StatsRow";
import { SocialLinks } from "@/components/stats/SocialLinks";
import { RecentUploads } from "@/components/content/RecentUploads";
import { FanFavorites } from "@/components/content/FanFavorites";
import { MILESTONE_CONFIG, nextMilestone } from "@/lib/milestones";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, items] = await Promise.all([getChannelStats(), getContentItems()]);

  return (
    <main>
      {/* Hydrates the shared store and polls /api/stats every 30s — Hero's
          count and the Milestone Journey's marker both read from it, so
          they can never drift out of sync with each other. */}
      <LiveStatsSync initialStats={stats} />

      <Hero initialStats={stats} />

      <MilestoneJourney initialStats={stats} />

      <StatsRow
        totalViews={stats.totalViews}
        contentCount={items.length}
        nextMilestone={nextMilestone(stats.subscriberCount)}
      />

      <SocialLinks />

      <ContentTimeline items={items} />

      <RecentUploads items={items} />

      <FanFavorites items={items} />

      {/*
        Celebration sequence (design spec section 10): explicitly deferred,
        by decision — a separate feature to build later, not part of V2.
      */}

      <p className="sr-only">
        Tracking the journey from {MILESTONE_CONFIG.chapterStart.toLocaleString()} to{" "}
        {MILESTONE_CONFIG.chapterGoal.toLocaleString()} subscribers.
      </p>
    </main>
  );
}
