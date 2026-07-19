require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID || 'UCLtCWRYhYmMof8kw7Ib1oqA'; // GetTheMoon

// Serve the actual website files
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory cache so we don't hammer the YouTube API
// (YouTube gives a limited free daily quota per key)
let cache = { data: null, ts: 0 };
const CACHE_MS = 60 * 1000; // reuse the same result for 60 seconds

app.get('/api/stats', async (req, res) => {
  try {
    if (cache.data && Date.now() - cache.ts < CACHE_MS) {
      return res.json(cache.data);
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'missing_api_key' });
    }

    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`;
    const r = await fetch(url);
    const json = await r.json();

    if (!json.items || !json.items.length) {
      console.error('Unexpected YouTube API response:', json);
      return res.status(502).json({ error: 'youtube_api_error' });
    }

    const stats = json.items[0].statistics;
    const data = {
      subscribers: parseInt(stats.subscriberCount, 10),
      views: parseInt(stats.viewCount, 10),
      videos: parseInt(stats.videoCount, 10),
      updatedAt: new Date().toISOString()
    };

    cache = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats_unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`GetTheMoon server running on port ${PORT}`);
});
