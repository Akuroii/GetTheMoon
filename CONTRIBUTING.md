# Contributing

## Install

```bash
npm install
```

Requires Node.js compatible with Next.js 16 and React 19 (Node 20+
recommended).

## Configure environment variables

```bash
cp .env.example .env
```

Fill in all four — see `DEPLOYMENT.md` §1 and §2 for where each one
actually comes from (Neon/Vercel Postgres dashboard, Google Cloud
Console, etc.). All four are required; `lib/youtube.ts` and `lib/db.ts`
will throw at call time (not import time — see those files' own comments)
if theirs is missing.

## Run locally

```bash
npm run dev
```

The homepage will render using whatever's currently in your database —
see "Seed data" below if that's nothing yet.

## Seed data

There's no seed script that inserts fake data — ingestion *is* the seed
step, and it pulls real data from your actual YouTube channel:

```bash
npm run ingest
```

This runs `scripts/ingest.ts`, which calls the exact same
`lib/ingest.ts` logic the production `/api/ingest` route uses — not a
separate, parallel implementation. Requires `DATABASE_URL`,
`YOUTUBE_API_KEY`, and `YOUTUBE_CHANNEL_ID` to be set; does not require
`INGEST_SECRET` (that's only checked by the HTTP route, not this script).

If you want to test against fake data instead of your real channel
without touching production YouTube quota, insert rows directly:

```bash
psql "$DATABASE_URL" -c "
  insert into channel_stats (id, subscriber_count, total_views, video_count, updated_at)
  values (1, 104827, 53724846, 398, now())
  on conflict (id) do update set subscriber_count = excluded.subscriber_count;
"
```

## Test ingestion

```bash
npm run ingest
```

Prints `Ingest complete: { subscriberCount, itemCount }` on success, or
the actual error and a non-zero exit code on failure — safe to run
repeatedly, since every write in `lib/ingest.ts` is an upsert plus the
reconciliation delete, not an append.

To test the production HTTP path specifically (auth included) rather than
the local script:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer $INGEST_SECRET"
```

## Build

```bash
npm run lint       # eslint . — not `next lint`, which no longer exists as of Next.js 16
npx tsc --noEmit
npm run build
```

All three should be clean before opening a PR. `next build` requires
outbound network access to fetch Google Fonts metadata (`next/font/google`)
— if this fails in a sandboxed CI environment, see `FINAL_REVIEW.md`'s
note on isolating that specific failure from an actual code problem.

## Deploy

See `DEPLOYMENT.md` for the full walkthrough — environment variables,
database provisioning, cron configuration, Vercel settings, and a
post-deployment verification checklist.

## Extend the project safely

A few structural rules worth keeping, not because they're arbitrary style
preferences, but because breaking them has already caused real bugs once
in this project's history (V1's):

- **Never hardcode `100000` or `500000` anywhere.** The chapter config
  lives in exactly one place: `lib/milestones.ts`. V1 duplicated this
  value by hand in two files and it caused a real "NaN%" bug when they
  drifted apart. If you need the goal, current chapter start, or the
  sub-milestone ladder, import it from there.
- **Never call the YouTube Data API from anywhere except `lib/youtube.ts`,
  and never import `lib/youtube.ts` from a Client Component.** This is
  the entire reason the site's architecture looks the way it does — see
  `SECURITY.md`.
- **Reconciliation logic (`lib/ingest.ts`'s final `DELETE`) should stay
  boring.** If you're tempted to make it "smarter" — soft deletes, audit
  trails, diffing — reconsider. A blunt, obviously-correct delete is
  deliberately preferred here over something cleverer in the one place a
  bug means silently wrong data. See the standing project principle on
  this in `TODO_V2.md`'s framing, if you want the fuller reasoning.
- **New API routes that touch Postgres need `export const dynamic =
  "force-dynamic"`.** Without it, `next build` may attempt to execute the
  route during static analysis, which fails without real credentials
  present — see `lib/db.ts`'s comment for the specific mechanism.
- **New polymorphic UI primitives (rendering as one of several possible
  elements) should type their forwarded props as `HTMLAttributes<HTMLElement>`,
  not `ComponentPropsWithoutRef<"div">` or similar.** `Pill.tsx` learned
  this the hard way during the production review — see `FINAL_REVIEW.md`'s
  Critical Issues section for the full story of why the narrower type
  doesn't type-check across multiple possible rendered elements.
- **If you add a new dependency, use it before merging, or don't add it.**
  Three packages (`gsap`, `motion`, `@base-ui/react`) were installed in
  anticipation of the Celebration feature and never actually imported —
  caught and removed during the production review. Add them back when
  Celebration is actually built, not before.
