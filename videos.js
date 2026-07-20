export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.CHANNEL_ID || 'UCLtCWRYhYmMof8kw7Ib1oqA'; // GetTheMoon

  if (!API_KEY) {
    return res.status(500).json({ error: 'missing_api_key' });
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
    const subscribers = parseInt(stats.subscriberCount, 10);

    // --- Milestone-crossing tracking ---------------------------------
    // The Milestone Journey component on the front end wants to know
    // *when* the current milestone bracket started, so it can show only
    // the uploads that happened during this chapter of the journey
    // ("Journey" mode). YouTube's API only ever gives us the CURRENT
    // subscriber count — it has no history endpoint — so the only way to
    // know when we crossed 75,000 (for example) is to notice it ourselves,
    // the moment it happens, and remember that timestamp somewhere durable.
    //
    // This function is stateless today (every request just proxies the
    // YouTube API), so there is nowhere to remember that. To finish this:
    //   1. Add a small persistent store — Vercel KV / Upstash Redis is the
    //      path of least resistance on Vercel, one free tier is plenty.
    //   2. Each time this function runs, read the last known subscriber
    //      count + milestone bracket from that store.
    //   3. If `subscribers` has crossed into a new bracket since last time,
    //      write { milestone: <new bracket>, reachedAt: new Date().toISOString() }.
    //   4. Return `milestoneReachedAt` (see below) so the front end can stop
    //      guessing and start scoping "Journey" mode exactly.
    //
    // Until that store exists, we return `milestoneReachedAt: null` and the
    // front end falls back to "most recent uploads" for Journey mode — it
    // still works, it's just an approximation instead of the real crossing date.
    const milestoneReachedAt = null; // TODO: wire up to persistent store, see above

    // Cache this response at the edge for 60 seconds, so repeat visits
    // don't spend extra YouTube API quota.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    res.status(200).json({
      subscribers,
      views: parseInt(stats.viewCount, 10),
      videos: parseInt(stats.videoCount, 10),
      avatar: snippet.thumbnails.medium.url,
      milestoneReachedAt,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats_unavailable' });
  }
}
