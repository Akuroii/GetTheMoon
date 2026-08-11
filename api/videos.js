function parseISODuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = parseInt((m && m[1]) || '0', 10);
  const mi = parseInt((m && m[2]) || '0', 10);
  const s = parseInt((m && m[3]) || '0', 10);
  return h * 3600 + mi * 60 + s;
}

// Only the production origin may read this response — see api/stats.js for why this
// doesn't affect the site's own same-origin fetch calls.
const ALLOWED_ORIGIN = 'https://getthemoon.vercel.app';
// GET/HEAD only — see api/stats.js for why the CORS header above doesn't cover this.
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

  // Every channel's "uploads" playlist ID is the channel ID with "UC" swapped for "UU".
  const UPLOADS_PLAYLIST = 'UU' + CHANNEL_ID.slice(2);

  try {
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

    const longVideos = items
      .map(it => {
        const info = infoById[it.snippet.resourceId.videoId] || { views: 0, durationSec: 0 };
        return {
          id: it.snippet.resourceId.videoId,
          title: it.snippet.title,
          publishedAt: it.snippet.publishedAt,
          views: info.views
        };
      })
      .filter((v, i) => (infoById[v.id] ? infoById[v.id].durationSec > 60 : true));

    const recent = longVideos.slice(0, 6);
    const popular = [...longVideos].sort((a, b) => b.views - a.views).slice(0, 6);
    const timeline = [...longVideos].sort(
      (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)
    );

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    res.status(200).json({ recent, popular, timeline, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'videos_unavailable' });
  }
}
