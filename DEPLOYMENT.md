# Deploying GetTheMoon V2

## 1. Required environment variables

Set these in Vercel (Project Settings → Environment Variables) and in a local
`.env` file (copy `.env.example`) for local development.

| Variable | Where it comes from | Notes |
|---|---|---|
| `DATABASE_URL` | Neon or Vercel Postgres dashboard | Pooled connection string, starts with `postgresql://` |
| `YOUTUBE_API_KEY` | Google Cloud Console | Server-side only — see §2 for how it's scoped |
| `YOUTUBE_CHANNEL_ID` | The channel's "About" page or YouTube Studio | Starts with `UC` |
| `INGEST_SECRET` | Anything random you generate, e.g. `openssl rand -hex 32` | Never committed; the cron job sends this as a Bearer token |

None of these are ever read by browser code. `YOUTUBE_API_KEY` is only
imported by `lib/youtube.ts`, which is only ever called from
`/api/ingest` and the local `scripts/ingest.ts` — never from a route the
browser calls.

## 2. Database setup (Neon or Vercel Postgres)

Either works — Vercel Postgres is Neon under the hood, so the steps are
nearly identical.

1. Create a project (Neon: neon.tech → New Project. Vercel Postgres:
   Vercel dashboard → Storage → Create Database → Postgres).
2. Copy the pooled connection string into `DATABASE_URL`.
3. Run `db/schema.sql` against it once, either via the provider's SQL
   console/editor, or locally:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
   This creates `channel_stats` and `content_items` and their indexes.
   Safe to re-run — every statement is `if not exists`.
4. Get a Google Cloud API key with the **YouTube Data API v3** enabled
   (Google Cloud Console → APIs & Services → Credentials → Create
   Credentials → API key), and restrict it to that API. This is
   `YOUTUBE_API_KEY`.

## 3. cron-job.org configuration

This is what actually keeps the site "live" — without it, `channel_stats`
and `content_items` never update after the first manual ingest.

Deliberately not using Vercel's built-in Cron Jobs (Hobby plan caps them at
once per day) or GitHub Actions' `schedule` trigger (auto-disables after 60
days of repo inactivity — a real risk for a project that goes quiet after
launch). A dedicated external pinger has neither limitation.

1. Create a free account at [cron-job.org](https://cron-job.org).
2. Create a new cron job:
   - **URL**: `https://<your-domain>/api/ingest`
   - **Method**: `POST`
   - **Schedule**: every 5–15 minutes (well inside YouTube's quota — see
     the architecture doc for the actual unit math)
   - **Headers**: add `Authorization: Bearer <your INGEST_SECRET value>`
3. Save, then trigger it once manually to confirm a `200` response with a
   JSON body like `{"ok":true,"subscriberCount":...,"itemCount":...}`.

If you'd rather not depend on a third-party scheduler at all, any service
that can send a scheduled authenticated POST request works the same way —
this isn't tied to cron-job.org specifically, just documented against it as
the concrete example.

## 4. Vercel settings

- **Framework preset**: Next.js (auto-detected)
- **Build command**: default (`next build`)
- **Root directory**: repo root
- **Node version**: default is fine
- Add all four environment variables from §1 before the first deploy —
  `/` and every `/api/*` route are `force-dynamic` and will fail at
  *request* time (not build time) without them, since `next build` never
  executes them itself.

## 5. First deployment steps

1. Push this repository to GitHub.
2. Import it in Vercel (New Project → select the repo).
3. Add the four environment variables.
4. Deploy.
5. Once live, manually trigger `/api/ingest` once (curl or Postman, with
   the `Authorization: Bearer` header) rather than waiting for the first
   cron tick — this populates `channel_stats` and `content_items` for the
   first time. Before this runs once, the homepage will render with the
   graceful fallback state (chapter-start subscriber count, no content
   items) rather than an error — that's expected, not a bug.
6. Set up the cron-job.org job from §3.

## 6. Post-deployment verification checklist

- [ ] `GET /api/stats` returns real JSON, not the 503 fallback
- [ ] `GET /api/timeline` returns your actual recent uploads
- [ ] `GET /api/fan-favorites` returns long-form videos only — spot-check
      that no Short or stream is in the response
- [ ] `GET /api/og` renders an image (not an error) — check by pasting the
      page URL into a social media debugger (e.g. Twitter/X's Card
      Validator or Facebook's Sharing Debugger)
- [ ] The homepage shows a real subscriber count, not the chapter-start
      fallback
- [ ] The avatar renders (confirms `avatar_url_youtube` was populated and
      `next.config.mjs`'s `remotePatterns` are correctly allowing YouTube's
      image CDN)
- [ ] Wait one cron interval, refresh, confirm the "updated" timestamp
      under the subscriber count actually changed
- [ ] Test `POST /api/ingest` **without** the Authorization header and
      confirm you get a `401`, not a `200` — this is the one security
      check worth doing by hand rather than trusting the code review alone

## 7. Common troubleshooting

**Homepage shows 100,000 subscribers and no content, permanently.**
Ingestion has never run successfully. Check the cron-job.org execution
history for the actual error response from `/api/ingest`, and check
Vercel's function logs for that route.

**`/api/ingest` returns 401.** The `Authorization` header doesn't match
`INGEST_SECRET` exactly — check for trailing whitespace or a stale value if
you've regenerated the secret since setting up the cron job.

**`/api/ingest` returns 500 with a YouTube-related error.** Almost always
either the API key isn't restricted-but-enabled for YouTube Data API v3, or
`YOUTUBE_CHANNEL_ID` is wrong — channel IDs start with `UC`, not a
`@handle`.

**Avatar or thumbnails don't load (broken image icons).** A YouTube image
host isn't in `next.config.mjs`'s `remotePatterns`. This has happened
before when Google serves a thumbnail from a host slightly outside the
three already allowlisted (`yt3.googleusercontent.com`, `yt3.ggpht.com`,
`i.ytimg.com`) — check the actual broken URL's hostname and add it if so.

**Build fails on Vercel with a Google Fonts error.** This would be a real
problem on Vercel specifically (unlike in this project's own development
sandbox, where the same failure was confirmed to be a sandboxed-network
issue, not a code issue) — Vercel's build environment has normal internet
access, so this shouldn't happen. If it does, it's worth checking Vercel's
status page before assuming it's this project's fault.

**Fan Favorites shows a Short or a stream.** Shouldn't be possible — it's
filtered at the SQL query level (`WHERE type = 'video'`) *and* again in the
component itself as a second guard. If this ever happens, check
`lib/ingest.ts`'s `classify()` function — it's the one place a video's
type gets decided, based on `liveStreamingDetails` presence (stream) or
duration ≤ 60s (short, the standard heuristic — YouTube's API has no
official field for this, so a small number of genuine edge cases are
expected, not a bug).
