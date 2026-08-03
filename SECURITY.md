# Security

## Why the YouTube API key never reaches the client

`YOUTUBE_API_KEY` is read in exactly one file: `lib/youtube.ts`. That file
is imported by exactly one other file: `lib/ingest.ts`. That file is
imported by exactly two callers: the `/api/ingest` route handler (server
runtime, POST-only, secret-protected) and `scripts/ingest.ts` (a local
Node script, never bundled into anything shipped to a browser).

Structurally, there is no import path from any `"use client"` component
to `lib/youtube.ts` — Next.js's build would need one to exist for the key
to ever end up in a client bundle, and none does. This was verified
directly, not assumed: every file containing `"use client"` was grepped
for `YOUTUBE_API_KEY` during the production review (`FINAL_REVIEW.md`);
none matched.

The browser only ever talks to this site's own `/api/*` routes, which
read pre-fetched data out of Postgres. It never constructs a YouTube API
URL, never sees an API key, and never has a code path that could.

This matters concretely: V1 (the predecessor to this project) reportedly
shipped a version that exposed API-related logic in frontend code at some
point in its history. This architecture is structured so that specific
mistake is not just avoided this time, but not easily reproducible by
someone extending the project later without realizing it — see
`CONTRIBUTING.md`'s rule on never importing `lib/youtube.ts` from a
Client Component.

## Secret management

Four secrets, all server-side-only environment variables, never committed:

| Secret | Scope |
|---|---|
| `DATABASE_URL` | Full read/write Postgres access |
| `YOUTUBE_API_KEY` | YouTube Data API v3 access for this channel |
| `YOUTUBE_CHANNEL_ID` | Not secret in the sense of needing protection (it's public), but kept alongside the others in `.env` for convenience |
| `INGEST_SECRET` | Authorizes writes to this site's own database via `/api/ingest` |

`.env` is git-ignored (`.gitignore`). `.env.example` documents the shape
without real values. Production values are set directly in Vercel's
environment variable dashboard, never in a file that touches version
control.

## Cron authentication

`/api/ingest` requires `Authorization: Bearer <INGEST_SECRET>`, checked
with exact string equality. No signature scheme, no timestamp/nonce replay
protection — a deliberately simple shared-secret check, appropriate for a
single trusted caller (one cron service, not a multi-tenant or
third-party-integration scenario). Returns `401` for anything else,
verified as an explicit item on `DEPLOYMENT.md`'s post-deployment
checklist rather than only trusted from a code read.

## Security considerations

- **SQL injection:** not applicable — every query in the codebase uses
  `@neondatabase/serverless`'s tagged-template `sql` function, which
  parameterizes values. There is no string concatenation building SQL
  anywhere in this project.
- **Image domains:** `next.config.mjs`'s `remotePatterns` allowlists
  exactly three YouTube CDN hostnames, not a wildcard — an image URL from
  an arbitrary host cannot be requested through `next/image` on this site.
- **CORS:** not explicitly configured; Next.js API routes default to
  same-origin unless configured otherwise, which is correct here — no
  route is intended to be called cross-origin by another site.
- **Rate limiting:** none implemented at the application layer on any
  route, public or internal (see Future Hardening below).
- **Dependency vulnerabilities:** `npm audit` reports 3 high-severity
  advisories, all inside Next.js's own bundled `postcss`/`sharp`
  dependencies, not this project's direct dependencies. `npm audit fix
  --force`'s suggested remediation would downgrade Next.js to version 9
  (from 2019) — a nonsensical fix that would break the entire project.
  These will resolve via normal Next.js version updates, not by acting on
  that suggestion.

## Future hardening recommendations

- **Rate limiting on the public GET routes.** Currently relies entirely
  on Vercel's platform-level protections. Adding application-level rate
  limiting (e.g., Vercel's own rate-limiting primitives, or a lightweight
  IP-based check) would be a reasonable addition if traffic ever grows
  enough for it to matter — not urgent at current scale.
- **Rotate `INGEST_SECRET` periodically**, and immediately if this
  repository or its environment variables are ever exposed
  (e.g., an accidental public repo, a compromised Vercel account).
- **Consider a request-signing scheme for `/api/ingest`** if the shared
  secret ever needs to be handed to more than one trusted caller — the
  current exact-string-match approach doesn't scale cleanly past "one
  cron service."
- **Self-hosting the avatar** (see `TODO_V2.md`) would also remove the
  runtime dependency on YouTube's CDN being available and correctly
  configured, which is a minor availability consideration more than a
  security one, but adjacent enough to note here.
