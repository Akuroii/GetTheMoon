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
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST}&maxResults=25&key=${API_KEY}`;
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

    const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${API_KEY}`;
    const vRes = await fetch(vUrl);
    const vJson = await vRes.json();

    const viewsById = {};
    (vJson.items || []).forEach(v => {
      viewsById[v.id] = parseInt(v.statistics.viewCount || '0', 10);
    });

    const videos = items.map(it => ({
      id: it.snippet.resourceId.videoId,
      title: it.snippet.title,
      views: viewsById[it.snippet.resourceId.videoId] || 0
    }));

    const recent = videos.slice(0, 6);
    const popular = [...videos].sort((a, b) => b.views - a.views).slice(0, 6);

    // These change rarely, so cache longer than the stats endpoint (10 minutes)
    // to keep well within YouTube's free daily quota.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

    res.status(200).json({ recent, popular, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'videos_unavailable' });
  }
}
