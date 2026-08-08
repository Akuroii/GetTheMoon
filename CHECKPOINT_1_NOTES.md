# Checkpoint 1 — Foundation fixes + 500K update

This checkpoint covers: two bugs found while auditing the live repo, the 500K
goal/milestone update, and the code-side security items that had a clear,
unambiguous answer. It does **not** yet cover the timeline/footer cleanup or
the visual-polish pass (glassmorphism, moon rotation, platform icons,
carousels, footer redesign, etc.) — those are next, see bottom.

## 1. Two live bugs found and fixed (unrelated to your list, found while auditing)

**The black hole celebration video was 404ing in production.** `index.html`
references `assets/celebration/blackhole-loop.mp4` and
`assets/celebration/blackhole-poster.jpg`, but those files were actually
sitting at your repo root (`/blackhole-loop.mp4`, `/blackhole-poster.jpg`) —
never moved into `assets/celebration/` after the last checkpoint. The video
layer of the celebration has been rendering nothing since that deploy. Fixed
by moving both files to the path the code already expects — no code changed.

**The favicon, apple-touch-icon, and cursor easter egg were showing the old
asteroid-rock design, not the comet design your last checkpoint
(`README_DEPLOY.md`) says replaced it.** Root had a correct new
`meteor.svg` and `meteor-180.png` that never actually got copied into
`assets/`; `meteor-32.png` and `meteor-cursor.png` never got a comet version
uploaded anywhere at all. I moved the two that existed and rendered the two
that didn't (from the corrected SVG, at the exact same pixel dimensions as
the files they replace, via `cairosvg`) — all four now match.

## 2. 500K goal + milestones

- `CONFIG.goal` → `500000`; `<title>`, all four OG/Twitter meta tags, and the
  belt's end label all updated to match.
- **Milestones vs. belt markers — I made a call rather than block on it, easy to undo.**
  Belt markers sit at their real value-fraction of the goal, not evenly by
  index. With all 13 of your milestones plotted, the first seven (1K–100K)
  would all land within the first 20% of the belt's length and overlap into
  a single unreadable blob — this isn't a style opinion, it's arithmetic
  (1000/500000 = 0.2% along the track, 100000/500000 = 20%, all seven of
  those values compressed into that same 20% span). So I split it:
  - `CONFIG.milestones` — the full 13 stops — still drives the text readout
    and the `‹›` stepper, so you keep full granularity there.
  - `CONFIG.beltMarkers` — a new, curated array,
    `[25000, 100000, 200000, 300000, 400000, 500000]` — is what actually gets
    plotted on the belt. Six markers, evenly spread, exactly as legible as
    the old 7-marker version. Clicking a physical marker still jumps the
    readout to that value's real position in the full 13-stop list.
  - One simplification that came with this: belt markers no longer have an
    "active/currently-selected" highlight state (there's no clean 1:1
    mapping from 13 stepper stops to 6 physical markers anymore). The belt
    still shows reached-vs-upcoming and the live comet position; "which
    stop am I inspecting" now lives entirely in the readout text, which
    already announces via `aria-live`. If you'd rather see all 13 plotted
    and accept the crowding, or want a different curated set, say so and
    I'll swap it — it's one array.
- `api/og.js`'s `GOAL`/`MILESTONES` updated to match (full 13-list — the OG
  card has no belt, just one progress segment, so there's no crowding
  concern there).
- `CELEBRATION_FLAG_KEY` renamed `'gtm_celebrated_100k'` →
  `'gtm_last_celebrated_goal'`. Since current subscribers are still below
  500,000, this rename does **not** cause the celebration to replay for
  anyone on deploy — `maybeTriggerRealCelebration` still only fires once
  `subscribers >= goal`, which won't be true until you actually cross 500K.

## 3. Security — done in code this checkpoint

- **Hardcoded channel-ID fallback removed** from `api/stats.js`,
  `api/videos.js`, `api/og.js`. `stats.js`/`videos.js` now return a clear
  `missing_channel_id` 500 if the env var isn't set. `api/og.js` keeps its
  existing "never break a social-preview image" philosophy — a missing
  `CHANNEL_ID` there just falls through to the branded fallback card instead
  of attempting a malformed request.
- **CORS locked to `https://getthemoon.vercel.app`** on `/api/stats` and
  `/api/videos`. Worth knowing: this stops other sites from *reading* the
  response in their own JS, but a browser will still let another page
  *trigger* the request — CORS doesn't stop quota exhaustion by itself. It's
  a real, worthwhile restriction, just not the rate-limiting item; see #4.
- **`X-Content-Type-Options: nosniff`** added directly in both API handlers
  and globally via `vercel.json`.
- **`vercel.json` now sets `X-Frame-Options: DENY`, `Referrer-Policy:
  strict-origin-when-cross-origin`, and a CSP** on every response.
- **The CSP ships as `Content-Security-Policy-Report-Only`, not enforced,
  on purpose.** Your CSS and JS both live inline in `index.html`, so a
  strict CSP needs either `'unsafe-inline'` (what I used) or a bigger
  refactor into external files with per-request nonces (which means turning
  the static HTML into a function, since nonces have to be generated per
  request — a real architecture change, not a header tweak). Report-Only
  mode reports violations to the browser console without blocking anything,
  so nothing on the live site can break from this. **Your action:** open the
  deployed site, check the console for `[Report Only]` CSP warnings — I
  enumerated the actual domains the page talks to (fonts, cdnjs, YouTube
  thumbnail/avatar CDNs) but can't render this in a real browser from here.
  Once the console is clean, tell me and I'll flip the header key to enforce
  it for real.
- **SRI added to the GSAP CDN script.** Cross-checked the same hash across
  three independent sources for this exact pinned version before adding it,
  rather than compute one myself with tooling I couldn't fully verify — a
  wrong hash would silently block GSAP site-wide.
- **`npm audit`: 0 vulnerabilities** across all three declared dependencies
  and their full transitive tree. Added `package-lock.json` (didn't exist
  before) so this stays reproducible and you get the same clean result on a
  fresh install rather than whatever the registry resolves to that day.
- **Error responses already didn't leak internals** — every catch block
  already returned a generic `{ error: 'x_unavailable' }' and logged the
  real error server-side only via `console.error`. Nothing to change here;
  flagging so you know it was checked, not skipped.
- **`robots.txt`** (allow all, points at the sitemap) and **`sitemap.xml`**
  (single URL — it's a one-page site) added at the repo root.
- **Canonical tag** (`<link rel="canonical">`) and a minimal **JSON-LD
  `WebSite` schema** (name, url, description, your five platform links as
  `sameAs`) added to `<head>`.

## 4. Security — needs your action, can't be done from code

- **Restrict the YouTube API key to "YouTube Data API v3" only**, in Google
  Cloud Console → Credentials → your key → API restrictions. Straightforward,
  do it whenever.
- **Skip the HTTP-referrer restriction you listed.** Referrer restrictions
  only work for keys called from a browser — this key is only ever called
  server-side (your Vercel functions calling Google directly), where there's
  no browser `Referer` header at all. Setting one would very likely make
  every request Google rejects, breaking `/api/stats`, `/api/videos`, and
  `/api/og` in production. IP-address restriction is the technically correct
  substitute for a server-only key, but Vercel's outbound IPs rotate by
  default — a fixed pair is a paid add-on (Static IPs, Pro/Enterprise,
  roughly $100/mo per project as of this year) that's hard to justify for
  this. Realistic protection for a server-only key is: API restriction
  (above) + Google Cloud Console's own quota alerts, which cost nothing.
- **Rate limiting: Vercel's own Firewall now does this natively, free, on
  every plan** — I didn't know this going in and checked before
  recommending anything. Dashboard → your project → Firewall → add a rate-limit
  rule on `/api/*`, no code required, and it protects `og.js` (edge runtime)
  the same as `stats.js`/`videos.js` (serverless), uniformly. I deliberately
  did **not** also wire the `@vercel/firewall` SDK into the function code —
  it needs a matching dashboard rule to mean anything, adds a dependency,
  and the dashboard rule alone already covers all three routes more simply.
  Say so if you'd rather have both layers.
- **The avatar (your Section 1 ask) isn't a code fix at all.** `api/stats.js`
  and `api/og.js` both pull `snippet.thumbnails.medium.url` live from the
  YouTube Data API on every poll — there's no avatar file anywhere in this
  repo. Uploading the new picture to your channel in YouTube Studio is the
  entire fix; the site will pick it up automatically within the minute
  (60s cache). The existing `.avatar-orbit img` CSS (fixed 36×36,
  `object-fit: cover`, `border-radius: 50%`) already crops any image to a
  clean circle, so there's nothing to adjust there regardless of which
  photo you use.

## 5. Repo cleanup

**Please delete these from your repo** (a zip can't delete anything, so
this has to be manual — each is either now-redundant or was already
flagged as unexplained clutter in your own `PROJECT_STATE.md`):

```
celebration-assets/          (entire folder — an old, pre-belt/pre-video
                               snapshot of the whole site. Since it's a real
                               folder in a Vercel-deployed repo, it was very
                               likely publicly reachable at
                               /celebration-assets/index.html — a stale
                               duplicate of your site, live, hitting your
                               real API and showing real subscriber data in
                               the old UI. Worth confirming it's gone from
                               search-engine caches too, once removed.)
videos.js                     (root — byte-identical to api/videos.js minus
                               a few comments, not wired to run as a
                               function, just dead weight)
blackhole-loop.mp4            (root — now correctly at
blackhole-poster.jpg           assets/celebration/, delete the root copies)
meteor.svg                    (root — now correctly at assets/meteor.svg)
meteor-180.png                (root — now correctly at assets/meteor-180.png)
```

## What's in this zip

```
index.html            (updated)
vercel.json           (updated — headers added)
package.json          (unchanged content, included for completeness)
package-lock.json     (new)
robots.txt            (new)
sitemap.xml           (new)
api/og.js             (updated)
api/stats.js          (updated)
api/videos.js         (updated)
assets/meteor.svg              (fixed — comet design)
assets/meteor-180.png          (fixed — comet design)
assets/meteor-32.png           (new render — comet design)
assets/meteor-cursor.png       (new render — comet design)
assets/celebration/blackhole-loop.mp4    (moved from root)
assets/celebration/blackhole-poster.jpg  (moved from root)
```

Drop these into your project at the same paths (overwrite what's there),
delete the five items in §5, then deploy.

## Verified before packaging

- `node --check` passes on the extracted inline `<script>` block.
- `vercel.json` is valid JSON.
- The Checkpoint-1 TDZ fix is still intact — `beltMarkerEls`/`beltCurrentEl`
  are still declared before `applyLang('en', false)` runs.
- No hardcoded channel ID or old flag-key string remains anywhere.
- `npm audit`: 0 vulnerabilities.
- Grepped for `api_key`/`secret`/`AIza…` patterns repo-wide: nothing exposed.

## Honest limitation

I don't have a real browser here, so the belt-marker layout change and the
CSP are verified by reading the code and math, not by looking at a rendered
page. Both are low-risk by design (the marker change is additive/reversible
in one array edit; the CSP is Report-Only and can't break anything) — but a
real load of the deployed site is still the actual test. Tell me what you
see and I'll fix it directly.

## Proposed next checkpoints (say if you want a different order)

1. **Timeline + footer cleanup** (your Section 3) — layout/readability pass,
   month labels, mobile behavior, footer divider/social icons/back-to-top.
2. **Visual polish** (your Section 4) — glassmorphism cards, moon rotation
   and hover, platform icons, carousel arrows + play-icon overlay + themed
   scrollbar, multicolor dust + grain texture, heading glow, staggered
   reveal-on-scroll. All built to the reduced-motion / 44px-touch-target /
   non-color-reliant rules already in place on the rest of the site.

Each will come as its own zip, same as this one.
