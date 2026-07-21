function parseISODuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = parseInt((m && m[1]) || '0', 10);
  const mi = parseInt((m && m[2]) || '0', 10);
  const s = parseInt((m && m[3]) || '0', 10);
  return h * 3600 + mi * 60 + s;
}

export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.CHANNEL_ID || 'UCLtCWRYhYmMof8kw7Ib1oqA'; // GetTheMoon

  // Every YouTube channel's "uploads" playlist ID is just the channel ID
  // with "UC" swapped for "UU" — this avoids spending an extra API call.
  const UPLOADS_PLAYLIST = 'UU' + CHANNEL_ID.slice(2);

  if (!API_KEY) {
    return res.status(500).json({ error: 'missing_api_key' });
  }

  try {
    // NOTE: bumped maxResults from 25 -> 50 (YouTube's per-call max) so the
    // Milestone Journey's "All uploads" mode has more than the last 25 to
    // show. If the channel has more than 50 uploads total, "All uploads"
    // will still only show the most recent 50 — paginating past that would
    // need playlistItems' pageToken, which isn't wired up yet. Fine for now
    // since "Journey" (the default view) only ever needs a handful anyway.
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST}&maxResults=50&key=${API_KEY}`;
    const plRes = await fetch(plUrl);
    const plJson = await plRes.json();

    if (!plJson.items) {
      console.error('Unexpected playlistItems response:', plJson);
      return res.status(502).json({ error: 'youtube_api_error' });
    }

    const items = plJson.items.filter(
      it => it.snippet && it.snippet.resourceId && it.snippet.resourceId.videoId
    );
    const ids = items.map(it => it.snippet.resourceId.videoId).join(',');

    // part=statistics,contentDetails — contentDetails.duration is what lets
    // us exclude Shorts (<=60s) below. This was present in an earlier draft
    // of this endpoint and got dropped; restoring it here.
    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids}&key=${API_KEY}`;
    const vRes = await fetch(vUrl);
    const vJson = await vRes.json();

    const infoById = {};
    (vJson.items || []).forEach(v => {
      infoById[v.id] = {
        views: parseInt(v.statistics.viewCount || '0', 10),
        durationSec: parseISODuration(v.contentDetails.duration)
      };
    });

    // Full dated list — this is what the Milestone Journey timeline plots.
    // publishedAt is what lets the front end lay videos out left-to-right
    // in true time order, and filter them into Journey / 12mo / 6mo / All.
    const videos = items
      .map(it => {
        const info = infoById[it.snippet.resourceId.videoId] || { views: 0, durationSec: 0 };
        return {
          id: it.snippet.resourceId.videoId,
          title: it.snippet.title,
          views: info.views,
          durationSec: info.durationSec,
          publishedAt: it.snippet.publishedAt
        };
      })
      // Exclude Shorts (60 seconds or under) so they don't clutter Recent /
      // Fan Favorites / the Milestone Journey timeline. If a video is missing
      // from the statistics response entirely (rare API hiccup), keep it
      // rather than silently dropping a real upload.
      .filter(v => (infoById[v.id] ? v.durationSec > 60 : true))
      .map(({ durationSec, ...v }) => v)
      .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

    const recent = [...videos].reverse().slice(0, 6);
    const popular = [...videos].sort((a, b) => b.views - a.views).slice(0, 6);

    // `milestoneReachedAt` (when the current bracket started) is resolved
    // and persisted in api/stats.js, not here — the front end fetches it
    // from /api/stats and uses it purely to filter this `videos` array for
    // "Journey" mode.

    // These change rarely, so cache longer than the stats endpoint (10 minutes)
    // to keep well within YouTube's free daily quota.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

    res.status(200).json({ recent, popular, videos, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'videos_unavailable' });
  }
}
