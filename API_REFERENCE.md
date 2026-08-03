# API Reference

Base URL: your deployed domain. All routes are under `/api/`.

Every route below was re-read from source immediately before writing this
document, not documented from memory.

---

## `GET /api/stats`

**Purpose:** current subscriber count and channel totals — what the Hero
and Milestone Journey poll every 30 seconds.

**Access:** public.

**Authentication:** none.

**Rate limiting:** none implemented at the application layer (see
`SECURITY.md`).

**Parameters:** none.

**Success response** — `200`:
```json
{
  "subscriberCount": 104827,
  "totalViews": 53724846,
  "videoCount": 398,
  "avatarUrlYoutube": "https://yt3.googleusercontent.com/...",
  "updatedAt": "2026-08-02T14:03:11.000Z"
}
```
`avatarUrlYoutube` is `null` if ingestion has run but YouTube returned no
thumbnail for some reason — the frontend handles this (see
`AvatarOrbit.tsx`).

**Error response** — `503`, only before the first successful ingestion run:
```json
{ "error": "No stats yet — ingestion hasn't run" }
```

**Caching:** `Cache-Control: s-maxage=30, stale-while-revalidate=60`.

---

## `GET /api/timeline`

**Purpose:** the content journey — every video/stream/short since the
chapter start date, most recent 40.

**Access:** public.

**Authentication:** none.

**Rate limiting:** none implemented at the application layer.

**Parameters:** none currently accepted. (`VISIBLE_LIMIT = 40` is a code
constant, not a query parameter — see `TODO_V2.md` for pagination as a
deferred item.)

**Success response** — `200`:
```json
[
  {
    "videoId": "abc123",
    "type": "video",
    "title": "Garten of Banban 0",
    "thumbnailUrl": "https://i.ytimg.com/...",
    "publishedAt": "2026-07-24T10:00:00.000Z",
    "viewCount": 908,
    "durationSeconds": 1450,
    "url": "https://www.youtube.com/watch?v=abc123"
  }
]
```
Empty array `[]` if ingestion has run but found nothing since the chapter
start date — not an error condition.

**Error response:** none application-defined; a Postgres-level failure
surfaces as a `500` with Next.js's default error body.

**Caching:** `Cache-Control: s-maxage=30, stale-while-revalidate=60`.

---

## `GET /api/fan-favorites`

**Purpose:** long-form videos only, ranked by views.

**Access:** public.

**Authentication:** none.

**Rate limiting:** none implemented at the application layer.

**Parameters:** none.

**Success response** — `200`: same shape as `/api/timeline`'s array, but
filtered to `type: "video"` only and sorted by `viewCount` descending,
capped at 12. The `WHERE type = 'video'` filter happens in SQL — see
`DATABASE_SCHEMA.md` — and is re-checked in the `FanFavorites` component
itself as a second guard.

**Error response:** same as `/api/timeline`.

**Caching:** `Cache-Control: s-maxage=60, stale-while-revalidate=120` —
deliberately longer than `/api/stats` and `/api/timeline`, since which
videos rank as favorites changes far more slowly than subscriber count or
the latest upload.

---

## `GET /api/og`

**Purpose:** dynamic Open Graph / social-preview image, rendered via
`@vercel/og`, showing the real current subscriber count and chapter
progress.

**Access:** public (this is what social platforms fetch when the site's
URL is shared).

**Runtime:** edge (`export const runtime = "edge"`).

**Authentication:** none.

**Rate limiting:** none implemented at the application layer.

**Parameters:** none currently accepted — always renders the current
live state; does not support arbitrary text overrides via query string.

**Success response** — `200`, `Content-Type: image/png`, 1200×630px image.

**Error response:** a Postgres failure here would surface as a `500`
before an image is ever returned; there's no try/catch fallback image in
this route currently (see `TODO_V2.md`).

**Caching:** none currently set explicitly on this route (see
`TODO_V2.md` — a real, if minor, gap: every crawler fetch re-queries
Postgres and re-renders the image from scratch).

---

## `POST /api/ingest`

**Purpose:** the only route allowed to call the YouTube Data API. Fetches
current channel stats and the full upload list, upserts everything into
Postgres, and deletes any tracked item no longer present on YouTube.

**Access:** internal / cron only. **Never called by the browser** — there
is no code path in any client-rendered component that references this
URL.

**Authentication:** required. `Authorization: Bearer <INGEST_SECRET>`,
compared with exact string equality against the `INGEST_SECRET`
environment variable.

**Rate limiting:** none implemented at the application layer — the
authentication requirement is the actual protection here, not a rate
limit.

**Parameters:** none.

**Success response** — `200`:
```json
{ "ok": true, "subscriberCount": 104827, "itemCount": 398 }
```

**Error responses:**
- `401` — missing or incorrect `Authorization` header:
  ```json
  { "error": "Unauthorized" }
  ```
- `500` — a YouTube API call or a Postgres write failed:
  ```json
  { "ok": false, "error": "<stringified error>" }
  ```
  Also logged server-side via `console.error` before the response is sent.

**Caching:** none — this is a write endpoint, not cacheable by definition.

---

## Public vs. internal summary

| Route | Method | Public? | Auth |
|---|---|---|---|
| `/api/stats` | GET | Yes | None |
| `/api/timeline` | GET | Yes | None |
| `/api/fan-favorites` | GET | Yes | None |
| `/api/og` | GET | Yes (by design — social crawlers) | None |
| `/api/ingest` | POST | **No** | Bearer secret required |
