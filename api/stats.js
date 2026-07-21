// Same bracket list the front end uses for the Milestone Journey progress
// bar (index.html CONFIG.milestones). Kept in sync manually since this file
// can't import from the client bundle — if you add/change a milestone on
// the front end, mirror it here too.
const MILESTONES = [1000, 5000, 10000, 25000, 50000, 75000, 100000];

// --- Tiny Upstash/Vercel KV REST client -------------------------------
// No SDK dependency on purpose — this project has zero npm dependencies,
// and Upstash's REST API is just two authenticated fetches. Works with
// either the Vercel KV integration (which sets KV_REST_API_URL /
// KV_REST_API_TOKEN automatically) or a standalone Upstash Redis database
// (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) — whichever pair of
// env vars is present is used.
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!r.ok) throw new Error(`kv get failed: ${r.status}`);
  const { result } = await r.json();
  return result ? JSON.parse(result) : null;
}

async function kvSet(key, value) {
  const r = await fetch(`${KV_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(value)
  });
  if (!r.ok) throw new Error(`kv set failed: ${r.status}`);
}

// Highest milestone bracket `subs` has reached (0 = hasn't hit the first one).
function bracketFor(subs) {
  let bracket = 0;
  for (const m of MILESTONES) {
    if (subs >= m) bracket = m;
    else break;
  }
  return bracket;
}

// Figures out when the channel entered its current milestone bracket, using
// KV as the memory YouTube's API doesn't give us (it only ever reports the
// CURRENT subscriber count, never history). On every call we compare the
// current bracket to the last-seen one; the first time we observe a new
// bracket, we stamp it with "now" and persist that. If KV isn't configured
// (env vars missing) this quietly no-ops and returns null, so local/preview
// use without a KV store still works — the front end just falls back to
// showing the most recent uploads for "Journey" mode instead of the exact
// milestone-to-milestone window.
async function resolveMilestoneReachedAt(subscribers) {
  if (!KV_URL || !KV_TOKEN) return null;

  const bracket = bracketFor(subscribers);
  if (bracket === 0) return null; // hasn't reached the first milestone yet

  try {
    const stored = await kvGet('milestone_state'); // { bracket, reachedAt } | null
    if (stored && stored.bracket === bracket) {
      return stored.reachedAt;
    }
    // New bracket (first run, or just crossed a threshold) — stamp it now.
    const reachedAt = new Date().toISOString();
    await kvSet('milestone_state', { bracket, reachedAt });
    return reachedAt;
  } catch (err) {
    // KV hiccup shouldn't take the whole stats endpoint down.
    console.error('milestone KV error:', err);
    return null;
  }
}

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
    const milestoneReachedAt = await resolveMilestoneReachedAt(subscribers);

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
