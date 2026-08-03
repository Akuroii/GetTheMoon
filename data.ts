import { sql } from "./db";
import { MILESTONE_CONFIG } from "./milestones";
import type { ChannelStats, ContentItem } from "./types";

export async function getChannelStats(): Promise<ChannelStats> {
  const rows = await sql`select * from channel_stats where id = 1`;
  const row = rows[0];

  if (!row) {
    // Sane fallback so the page still renders before the first ingestion
    // run has ever happened, rather than crashing.
    return {
      subscriberCount: MILESTONE_CONFIG.chapterStart,
      totalViews: 0,
      videoCount: 0,
      avatarUrlYoutube: null,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    subscriberCount: row.subscriber_count,
    totalViews: row.total_views,
    videoCount: row.video_count,
    avatarUrlYoutube: row.avatar_url_youtube,
    updatedAt: row.updated_at,
  };
}

export async function getContentItems(): Promise<ContentItem[]> {
  const rows = await sql`
    select * from content_items
    where published_at >= ${MILESTONE_CONFIG.chapterStartDate}
    order by published_at desc
    limit 100
  `;

  return rows.map((r) => ({
    videoId: r.video_id,
    type: r.type,
    title: r.title,
    thumbnailUrl: r.thumbnail_url,
    publishedAt: r.published_at,
    viewCount: r.view_count,
    durationSeconds: r.duration_seconds,
    url: r.url,
  }));
}
