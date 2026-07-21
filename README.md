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
- **`test/smoke.mjs`** + **`package.json`** — optional headless regression
  test for `index.html` (see "Regression testing" below). Not required for
  deployment.

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
2. Deploy. That's it — `index.html` uses `DATA_MODE = 'auto'` (see below),
   so it automatically calls the real API once it's reachable and only
   falls back to sample data if that call fails. There's no flag to
   remember to flip.

### `DATA_MODE`

Near the top of `index.html`'s `<script>`:

```js
const DATA_MODE = 'auto';
```

- **`'auto'`** (default, recommended) — calls `/api/stats` and
  `/api/videos`; if either fails for any reason (no server, missing/invalid
  API key, network hiccup) it quietly falls back to the built-in sample
  data instead of leaving the page stuck on `—` / `loading…`. Works
  correctly both when opened as a local file (no server → sample data) and
  once deployed with a real key (→ real data), automatically.
- **`'mock'`** — always show sample data, even if the real API would work.
  Handy for local design/styling work.
- **`'live'`** — always call the real API and never fall back, so a broken
  deployment fails loudly (empty carousels / frozen numbers) instead of
  quietly showing sample numbers. Use this only when you're specifically
  trying to debug the API integration and don't want mock data masking it.

## Regression testing

`test/smoke.mjs` is a small headless check (using jsdom) that loads
`index.html`, runs its script with a simulated failing API (so it exercises
the `'auto'` → mock-fallback path), then drives the Milestone Journey UI —
switching timeline modes, expanding/collapsing, toggling language, and
using the custom scrollbar's keyboard controls — and fails if anything
throws or key elements never populate. Run it after touching `index.html`:

```
npm install
npm test
```

It's a smoke test, not full coverage — it can't verify pixel-level styling
or real API responses — but it catches the class of bug where a change to
one part of the page silently breaks another (which is how a couple of the
issues below were confirmed fixed).

## Changelog: stability pass

A round of fixes after a report of regressions on the live site:

- **Mock data was stuck on in production.** The old `USE_MOCK_DATA = true`
  flag had to be manually flipped after deploying, and had no fallback if
  the real API ever failed — either way, the page could get stuck showing
  sample data or frozen placeholders. Replaced with `DATA_MODE = 'auto'`
  (see above), which calls the real API automatically and only falls back
  to sample data on an actual failure.
- **YouTube Shorts were no longer filtered out.** An earlier version of
  `api/videos.js` excluded Shorts (≤60s) from Recent/Popular/the timeline;
  that logic didn't make it into the current endpoint. Restored.
- **The timeline's horizontal scrollbar was a raw native browser
  scrollbar** — unstyled, and easy to mistake for a second, mismatched
  progress bar sitting under the real one. Replaced with a custom
  violet-to-gold themed scrollbar matching the milestone progress bar,
  fully draggable, clickable, and keyboard-operable (arrow keys / Home /
  End), with the native one hidden across all browsers.
- Removed a small piece of dead code in the progress-bar renderer (it built
  a string that was immediately overwritten and never shown — zero
  behavior change, just cleanup).

The milestone-bracket percentage math itself (e.g. "30% of the way there")
was checked by hand against several values and is correct — the scrollbar
fix above was the most likely source of it *looking* wrong, since the old
scrollbar sat directly beneath it looking like a second, differently-filled
bar.
