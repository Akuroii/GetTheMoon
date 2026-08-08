// Only the production origin may read this response. Same-origin calls from the site's
// own frontend are unaffected either way — browsers never apply CORS to same-origin
// requests — this only stops other sites from embedding/reading this endpoint directly.
const ALLOWED_ORIGIN = 'https://getthemoon.vercel.app';

export default async function handler(req, res) {
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

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    res.status(200).json({
      subscribers: parseInt(stats.subscriberCount, 10),
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
