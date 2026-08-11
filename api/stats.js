// Only the production origin may read this response. Same-origin calls from the site's
// own frontend are unaffected either way — browsers never apply CORS to same-origin
// requests — this only stops other sites from embedding/reading this endpoint directly.
const ALLOWED_ORIGIN = 'https://getthemoon.vercel.app';
// GET/HEAD only. CORS above only stops other origins' JS from *reading* the response —
// it does nothing to stop the request from being *sent and executed*, since a plain
// GET/POST with no custom headers never triggers a CORS preflight. Without this check,
// anyone could script repeated POST/PUT/DELETE/etc. requests and every one of them would
// still hit the real YouTube API. See CHECKPOINT_5_NOTES.md.
const ALLOWED_METHODS = ['GET', 'HEAD'];

export default async function handler(req, res) {
  if (!ALLOWED_METHODS.includes(req.method)) {
    res.setHeader('Allow', ALLOWED_METHODS.join(', '));
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.CHANNEL_ID;

  if (!API_KEY) {
    return res.status(500).json({ error: 'missing_api_key' });
  }
  if (!CHANNEL_ID) {
    return res.status(500).json({ error: 'missing_channel_id' });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`;
    const r = await fetch(url);
    const json = await r.json();

    if (!json.items || !json.items.length) {
      console.error('Unexpected YouTube API response:', json);
      return res.status(502).json({ error: 'youtube_api_error' });
    }

    const stats = json.items[0].statistics;
    const snippet = json.items[0].snippet;

    // Defensive: a channel can choose to hide its subscriber count, in which case
    // YouTube's API omits `subscriberCount` entirely and this would otherwise be NaN —
    // which renders client-side as the literal text "NaN" and produces an invalid CSS
    // custom property on the moon's --fill. Falls back to 0 rather than propagating NaN.
    const rawSubs = Number(stats.subscriberCount);
    const subscribers = Number.isFinite(rawSubs) ? Math.max(0, Math.trunc(rawSubs)) : 0;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    res.status(200).json({
      subscribers,
      views: parseInt(stats.viewCount, 10),
      videos: parseInt(stats.videoCount, 10),
      avatar: snippet.thumbnails.medium.url,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats_unavailable' });
  }
}
