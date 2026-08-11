# Checkpoint 5 — Security audit fixes, round 1 (code-only, no behavior changes)

Follows the pre-launch security/reliability audit (`GetTheMoon_Security_Audit_2026-08-09.md`).
This checkpoint covers only the findings that are pure code fixes with no product
decision attached — nothing here changes what a normal visitor sees or does. CSP
enforcement and the stale-file cleanup are deliberately **not** in this checkpoint; see
"What's next" below for why.

**Touched:** `api/stats.js`, `api/videos.js`, `api/og.js`, `index.html`. Nothing else.

## 1. HIGH — all three API routes now reject non-GET/HEAD requests

The audit's core finding: none of the three handlers ever checked `req.method`, so a
CORS header alone wasn't stopping anything — CORS only blocks other origins' JS from
*reading* a response, not from *sending* the request in the first place, and a plain
GET/POST never triggers a preflight. Anyone could already script repeated hits from
anywhere and every one would still burn real YouTube API quota.

- `api/stats.js` / `api/videos.js` (Node runtime): added an `ALLOWED_METHODS` allowlist
  and a 405 short-circuit as the first thing the handler does, before the CORS header
  or any env var is even touched.
- `api/og.js` (**Edge** runtime): same idea, different shape — this file returns a raw
  `Response`, not `res.status().json()`, so it gets its own 405 branch that matches how
  the rest of the file already responds.

## 2. MEDIUM — the negative-subscriber-count bug, both instances

Your agent caught one live render showing "-167,108 Subscribers." Reading the code
showed why (`Math.min(...)` alone lets the progress ratio go negative under unusual
`requestAnimationFrame`/`performance.now()` timing) — and showed a second, previously
unflagged instance of the *identical* pattern:

- `index.html` → `animateNumber()`: added the missing `Math.max(0, ...)` floor. This is
  the one that produced the number your agent saw.
- `index.html` → `applyStats()`: `fillPct` had the same unclamped `Math.min(...)` —
  this one drives the moon's glow (`--fill`), not the number readout, so it wouldn't
  have shown as a wrong number, just a broken/invalid glow value. Same fix.
- `api/stats.js`: added a server-side guard on `subscriberCount` itself. This is the
  actual root cause, not just a symptom-patch: a channel can choose to hide its
  subscriber count, in which case YouTube's API **omits the field entirely**, which
  today would parse as `NaN` and flow straight through the JSON response. Now falls
  back to `0` if the value isn't a finite number.
- **Found while fixing, same root cause, extended into `api/og.js` too:** the OG-image
  endpoint had the exact same unguarded `parseInt(subscriberCount, 10)`. Fixed the same
  way, but with one deliberate difference: it falls back to `null`, not `0` — `null` is
  what makes `subs === null` correctly trigger the *existing* branded fallback card
  ("getthemoon · the subscriber watch") instead of rendering a card that says
  "NaN subscribers." `0` would have been the wrong fallback here specifically.

## 3. MEDIUM — `api/og.js` fetches now time out

Added a small `fetchWithTimeout()` helper (`AbortController` + a per-call ceiling) and
used it for **both** outbound fetches in this file, not just the one the audit named:

- The two Google Fonts fetches (3s each) — `Promise.allSettled` already turned an
  outright *failed* font fetch into a safe system-sans fallback, but a *stalled* one is
  a different failure mode that wasn't covered before. This closes that gap.
- The YouTube channel-stats fetch (4s) — same reasoning, applied consistently rather
  than leaving one fetch in the file on a different (unbounded) standard than the
  other. A little more budget than the fonts since losing the real subscriber count
  matters more than losing a custom typeface.

Why this matters here specifically: `og.js` runs on Vercel's Edge runtime, which is now
the deprecated path (Vercel steers new projects to the standard Node.js runtime
instead), and that runtime's own idle-connection ceiling is longer than most
link-unfurl bots (Slack/Discord/X previews) will wait. Without an app-level timeout, a
slow font or API host could make the OG image intermittently fail to show up in shared
links well before the platform's own limit ever kicks in.

**Spotted, deliberately not touched this checkpoint:** the YouTube fetch and the font
loading currently run *sequentially* (`await` the YouTube call, then `await` the fonts),
even though they don't depend on each other. Running them concurrently
(`Promise.all([...])`) would roughly halve this endpoint's typical latency. Didn't fold
it into this pass — it's a real restructuring of the function's control flow, not a
one-line safety add like everything else here, and I wanted this checkpoint's diff to
stay minimal and low-risk. Worth its own small checkpoint if you want it.

## 4. LOW — `stale-while-revalidate` given an explicit value

Small, unrelated-to-security "also fixed while in the file": `api/stats.js` and
`api/videos.js` were sending `stale-while-revalidate` with no number (only `api/og.js`
had one). Vercel's edge was evidently still honoring it — your agent's live check
showed real HIT/STALE caching — but the directive is only well-defined with an
explicit duration. Now `=300` on stats, `=1200` on videos, matching og's existing
`=600` pattern of "roughly double the s-maxage."

## Verified before packaging

- `node --check` passes on all three edited `api/*.js` files (copied to `.mjs`
  temporarily to check them as the ES modules they actually are — plain `node --check`
  on a `.js` file would otherwise misparse the `export default`/`import` syntax; this
  is why no earlier checkpoint's notes mention running it directly against these files).
- `node --check` passes on the extracted inline `<script>` block in `index.html` (the
  actual app-logic block — not the JSON-LD structured-data script, which isn't
  JavaScript and would fail that check for unrelated reasons).
- `req.method` is now checked in all three API files — grepped directly, one hit each.
- `ALLOWED_ORIGIN` / `ALLOWED_METHODS` each declared exactly once per file — no
  duplicate-declaration risk introduced.
- Both clamp fixes present exactly once in `index.html`.
- `fetchWithTimeout(` used at both call sites in `api/og.js` — the font loop and the
  YouTube call.
- Full tag-balance check on `index.html` (div/button/svg/script/style/section/
  header/footer) — all matched, nothing unbalanced by the edits.
- No other line in any of the four files changed beyond what's described above —
  diffed each file against the pre-checkpoint copy.

## Not touched, as instructed by the audit's own scoping

- CSP is still `Content-Security-Policy-Report-Only` — unchanged. Flipping this
  (and the `Permissions-Policy` addition) is Checkpoint 6, on purpose: your own
  Checkpoint 1 notes already established the right sequencing for CSP changes —
  ship it, verify the console is clean on a real load, *then* enforce — and I'm
  following that same caution rather than overriding it just because this round
  is about "fixing things."
- The stale root-level files (`videos.js`, `meteor.svg`, `meteor-180.png`,
  `blackhole-loop.mp4`, `blackhole-poster.jpg`, `getthemoon_orbit_tdz_hotfix.diff`)
  and the missing `.gitignore` are Checkpoint 7 — deletions can't ship in a zip
  either way (same limitation every prior checkpoint has flagged), so that round
  will be mostly instructions plus the new `.gitignore` file itself.
- Rate limiting (Vercel Firewall), the YouTube API key restriction in Google Cloud
  Console, and Search Console submission are still dashboard/account actions with
  no code-side lever — carried over from the audit, not re-explained here.
- The `?celebrate=1` public QA hook — that's a product decision (keep it as a
  permanent feature, or gate/remove it), not something to decide unilaterally in a
  security-fix checkpoint.

## What's next

- **Checkpoint 6** — CSP → SHA-256 hash sources (drop `'unsafe-inline'`, stay
  Report-Only for one more deploy so you can verify the console is clean, same as
  Checkpoint 1's approach), plus `Permissions-Policy`.
- **Checkpoint 7** — delete-these-files instructions + a new `.gitignore`.
- Say if you'd rather reorder these, want the `Promise.all` og.js optimization
  folded in somewhere, or want a decision made now on `?celebrate=1` instead of
  waiting.

## What's in this zip

```
index.html       (updated — supersedes Checkpoint 4's copy)
api/stats.js      (updated)
api/videos.js     (updated)
api/og.js         (updated)
CHECKPOINT_5_NOTES.md
```

Everything else from prior checkpoints (assets, `vercel.json`, `package.json`, etc.) is
unchanged and still applies — this zip doesn't repeat those files.
