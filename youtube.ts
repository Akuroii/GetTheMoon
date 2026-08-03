// SERVER-SIDE ONLY. This file reads YOUTUBE_API_KEY directly and must never
// be imported from a Client Component. Its only callers are lib/ingest.ts
// and, transitively, the ingest API route and the local ingest script —
// never a route the browser calls, and never the browser itself.

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

const BASE = "https://www.googleapis.com/youtube/v3";

function requireEnv() {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not set");
  if (!CHANNEL_ID) throw new Error("YOUTUBE_CHANNEL_ID is not set");
}

export async function fetchChannelStats() {
  requireEnv();
  const url = `${BASE}/channels?part=statistics,snippet,contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube channels.list failed: ${res.status}`);
  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) throw new Error("Channel not found");

  return {
    subscriberCount: Number(channel.statistics.subscriberCount),
    totalViews: Number(channel.statistics.viewCount),
    videoCount: Number(channel.statistics.videoCount),
    avatarUrl:
      channel.snippet.thumbnails.high?.url ?? channel.snippet.thumbnails.default?.url ?? null,
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads as string,
  };
}

// playlistItems.list costs 1 unit per call regardless of how many pages the
// channel needs — this is the deliberately cheap way to enumerate uploads,
// search.list (100 units/call) is never used anywhere in this file.
export async function fetchAllUploadIds(uploadsPlaylistId: string): Promise<string[]> {
  requireEnv();
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE}/playlistItems`);
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", API_KEY!);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`YouTube playlistItems.list failed: ${res.status}`);
    const data = await res.json();

    ids.push(...data.items.map((i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return ids;
}

export interface VideoDetails {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  durationSeconds: number;
  isStream: boolean;
}

function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

// Batches of 50 IDs per call — the whole channel history stays a handful of
// calls even as it grows into the thousands, well inside the daily quota.
export async function fetchVideoDetails(ids: string[]): Promise<VideoDetails[]> {
  requireEnv();
  const results: VideoDetails[] = [];

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL(`${BASE}/videos`);
    url.searchParams.set("part", "snippet,statistics,contentDetails,liveStreamingDetails");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", API_KEY!);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`YouTube videos.list failed: ${res.status}`);
    const data = await res.json();

    for (const v of data.items ?? []) {
      results.push({
        id: v.id,
        title: v.snippet.title,
        thumbnailUrl: v.snippet.thumbnails.high?.url ?? v.snippet.thumbnails.default.url,
        publishedAt: v.snippet.publishedAt,
        viewCount: Number(v.statistics.viewCount ?? 0),
        durationSeconds: parseIsoDuration(v.contentDetails.duration ?? "PT0S"),
        isStream: Boolean(v.liveStreamingDetails),
      });
    }
  }

  return results;
}
