# Get The Moon — Milestone Journey

A live subscriber-count page for GetTheMoon, built around a "Milestone
Journey" timeline instead of a plain progress bar.

## What's in this project

- **`index.html`** — the full page (markup, styles, and client JS in one
  file). Renders on illustrative sample data out of the box (see
  `USE_MOCK_DATA` below), so you can open it directly with no server running.
- **`api/stats.js`** — subscriber/view/video counts from the YouTube Data
  API, plus `milestoneReachedAt`: the timestamp the channel entered its
  current milestone bracket (1K / 5K / 10K / 25K / 50K / 75K / 100K),
  persisted in a small key-value store so it survives across requests.
- **`api/videos.js`** — recent uploads, most-viewed uploads, and the full
  dated upload history the Milestone Journey timeline plots.
- **`vercel.json`** — minimal Vercel config (Vercel auto-detects the `api/`
  folder as serverless functions; no extra routing needed).

## Environment variables (set these in your Vercel project settings)

| Variable | Required | What it's for |
|---|---|---|
| `YOUTUBE_API_KEY` | Yes | YouTube Data API v3 key. Without it, `/api/stats` and `/api/videos` return `500`. |
| `CHANNEL_ID` | No | Defaults to GetTheMoon's channel ID. Override to point at a different channel. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | No, but recommended | Enables the persistent milestone tracking below. If you add the **Vercel KV** integration to the project, these are set automatically. |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | No | Alternative to the pair above, if you're using a standalone Upstash Redis database instead of Vercel KV. Either pair works. |

Without the KV variables, everything still works — `/api/stats` just
returns `milestoneReachedAt: null`, and the front end falls back to
showing the dozen most recent uploads for "Journey" mode instead of the
exact milestone-to-milestone window.

## How milestone tracking works

YouTube's API only ever reports the *current* subscriber count — it has no
history endpoint. So `api/stats.js` remembers, on its own, the moment the
channel crosses into a new milestone bracket: every request it checks the
current bracket against the last one it saw in the KV store, and the first
time it sees a new one, it stamps that moment as `reachedAt` and persists
it. Every request after that just reads the stored timestamp back — no
extra YouTube API calls involved. See the comments in `api/stats.js` for
the exact logic.

*Known limitation:* if the subscriber count hovers right at a bracket
boundary (e.g. bounces between 74,999 and 75,000 from natural churn), the
bracket — and therefore `reachedAt` — can flicker. Not worth guarding
against at this scale; worth knowing about if you ever see the Journey
window unexpectedly reset.

## Surprise celebrations

Besides the big 100K celebration, `index.html` has a `CONFIG.surpriseMilestones`
array — subscriber counts that trigger the same full-screen celebration,
but with their own message, and that **don't appear anywhere on the visible
progress bar**, so hitting one is a genuine surprise to visitors. One is set
up for 96,000 as an example:

```js
surpriseMilestones: [
  {
    subs: 96000,
    msg: { en: '96,000. The horizon is glowing.', ar: '٩٦,٠٠٠. الأفق يتوهّج.' },
    sub: { en: 'Almost home.', ar: 'اقتربنا.' }
  }
]
```

Add as many entries as you want. Each one fires once per visitor session,
the moment the count is *observed* crossing it live (not retroactively if
someone loads the page after it's already passed — same behavior as the
100K celebration). It reuses the same celebration overlay as the 100K
moment, just with a lighter particle burst, so the final goal still reads
as the biggest moment.

## Going live

1. Set `YOUTUBE_API_KEY` (required) and, ideally, the KV variables above in
   your Vercel project.
2. Deploy — `/api/stats` and `/api/videos` will start returning real data.
3. In `index.html`, flip:
   ```js
   const USE_MOCK_DATA = true;
   ```
   to `false`. Left as `true` intentionally for now so this stays safe to
   preview and edit without a live deployment — flip it once you've
   confirmed the API routes work in your Vercel deployment (visit
   `/api/stats` directly in the browser; you should see real JSON, not an
   error).
