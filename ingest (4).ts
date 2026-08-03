import { sql } from "./db";
import { fetchChannelStats, fetchAllUploadIds, fetchVideoDetails } from "./youtube";
import type { ContentType } from "./types";

// No official API field distinguishes Shorts — this duration threshold is
// the honest, standard heuristic, not a solved classification. A handful
// of edge-case videos may land in the wrong bucket; that's a real,
// permanent limitation of the platform, not a bug in this function.
const SHORT_DURATION_THRESHOLD_SECONDS = 60;

function classify(durationSeconds: number, isStream: boolean): ContentType {
  if (isStream) return "stream";
  if (durationSeconds > 0 && durationSeconds <= SHORT_DURATION_THRESHOLD_SECONDS) return "short";
  return "video";
}

export async function runIngest() {
  const channel = await fetchChannelStats();
  const ids = await fetchAllUploadIds(channel.uploadsPlaylistId);
  const videos = await fetchVideoDetails(ids);

  await sql`
    insert into channel_stats (id, subscriber_count, total_views, video_count, avatar_url_youtube, updated_at)
    values (1, ${channel.subscriberCount}, ${channel.totalViews}, ${channel.videoCount}, ${channel.avatarUrl}, now())
    on conflict (id) do update set
      subscriber_count = excluded.subscriber_count,
      total_views = excluded.total_views,
      video_count = excluded.video_count,
      avatar_url_youtube = excluded.avatar_url_youtube,
      updated_at = now()
  `;

  for (const v of videos) {
    const type = classify(v.durationSeconds, v.isStream);
    await sql`
      insert into content_items
        (video_id, type, title, thumbnail_url, published_at, view_count, duration_seconds, is_short_heuristic, url, synced_at)
      values
        (${v.id}, ${type}, ${v.title}, ${v.thumbnailUrl}, ${v.publishedAt}, ${v.viewCount}, ${v.durationSeconds}, ${type === "short"}, ${`https://www.youtube.com/watch?v=${v.id}`}, now())
      on conflict (video_id) do update set
        title = excluded.title,
        thumbnail_url = excluded.thumbnail_url,
        view_count = excluded.view_count,
        synced_at = now()
    `;
  }

  // The reconciliation step: anything not present in this run's fetch is
  // gone from YouTube, so it's removed here too. One blunt DELETE,
  // deliberately — see lib/milestones.ts and the earlier discussion for why
  // this specific piece of logic should stay boring rather than clever.
  const currentIds = videos.map((v) => v.id);
  if (currentIds.length > 0) {
    await sql`delete from content_items where video_id != all(${currentIds})`;
  }

  return { subscriberCount: channel.subscriberCount, itemCount: videos.length };
}
