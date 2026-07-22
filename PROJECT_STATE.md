# PROJECT_STATE — GetTheMoon

## Known-working, as of Checkpoint 3B
- Homepage loads and renders (Checkpoint 1 TDZ fix intact).
- `/api/stats`, `/api/videos`, `/api/og` all return real JSON/images (untouched
  this session — see "Not touched" below).
- Orbital milestone track, carousels, timeline, i18n (EN/AR), reduced-motion
  handling, and the CP3 celebration-reliability gating all function per prior
  checkpoints.
- Default 100K celebration (`triggerCelebration()`), `?celebrate=1` QA path,
  and the real `gtm_celebrated_100k` gate are **unchanged and still the only
  thing that runs in production** — see Checkpoint 3B scope below.

## Checkpoint 3B — Celebration visual v2 (code-only prototype, test-flag only)

**Touched:** `index.html` only. Nothing else in the repo was modified.

**Goal:** prototype a new "Journey → Black Hole → Darkness → Moon → 100K"
celebration sequence using the real 12 `assets/celebration/*.png` images as
live `<img>` elements, reachable only behind `?celebrate=1&visual=v2`, without
touching the current default celebration in any way.

### What was added
1. **`triggerCelebrationV2(milestone, images, audio)`** — a new, separate
   function (not a rewrite of `triggerCelebration()`). Sequence, driven by a
   single GSAP timeline:
   - 0.0–0.5s: CSS-built "event horizon" (`.v2-event-horizon`, radial
     gradient + glow, no new image assets) fades/scales in.
   - 0.5–3.2s: the real `CONFIG.celebrationImages` are rendered as actual
     `<img>` tags arranged in a circle around the horizon and faded in.
   - 3.2–5.8s: each image is GSAP-tweened toward the center (`left/top: 50%`,
     `scale: 0.05`, `opacity: 0`, a light 2px blur), staggered slightly per
     image.
   - 5.8–6.6s: a full-bleed `.v2-darkness` overlay fades in as the horizon
     fades out.
   - 6.6–8.0s: a **clone of the site's existing `.moon` element** (via
     `buildV2Moon()`, `cloneNode(true)` off `.moon-stage .moon`, carrying over
     its live `--fill` value) fades in — no new moon asset was created.
   - 8.0s+: reuses the *existing* `#celebrateText` / `#celebrateMsg` /
     `#celebrateSub` / `#celebrateHint` elements and copy ("We got the Moon." /
     "A new orbit begins.") — same `revealText()` pattern as v1.
2. **`buildV2Moon()`** — small helper, clones the live moon node rather than
   introducing a new SVG/asset.
3. **New, additive-only CSS** (`#celebrateV2Stage`, `.v2-event-horizon`,
   `.v2-horizon-static`, `.v2-memory-img`, `.v2-darkness`, `.v2-moon-reveal`,
   plus a `max-width:560px` block for them) using only existing design tokens
   (`--violet`, `--pink`, `--gold`, `--line`). No new colors introduced.
4. **Test hook extended, not replaced.** `initCelebrateTestHook()` now also
   reads `?visual=v2` from the query string. `?celebrate=1` alone still calls
   `triggerCelebration()` exactly as before; `?celebrate=1&visual=v2` calls
   `triggerCelebrationV2()` instead. Neither path touches
   `maybeTriggerRealCelebration()` or `CELEBRATION_FLAG_KEY`
   (`gtm_celebrated_100k`) — verified by reading the code path (see Checks
   below).
5. **Close-handler cleanup (the one bit of "existing code" this touched).**
   The `#celebrate` click handler and the document `Escape` keydown handler
   now also call `el._v2Cleanup()` if it's set. `_v2Cleanup` is only ever
   assigned inside `triggerCelebrationV2()`, so this is a no-op for the
   default v1 celebration and for `?celebrate=1` without `&visual=v2`. Needed
   because v2 builds its own DOM (`#celebrateV2Stage`) and, without this, a
   mid-timeline close would leave orphaned elements and a running GSAP
   timeline behind.
6. **Legacy element hide/restore.** While v2 runs, the always-present
   `#memoryMontage` and `.horizon` elements (used by v1) are set to
   `display:none` so they don't visually double up with the v2 stage, and are
   restored (`display:''`) by `cleanupV2()` on close or on fallback.
7. **Graceful degradation, three layers:**
   - `prefers-reduced-motion`: no spiral/pull motion at all — static event
     horizon + moon clone + immediate text reveal.
   - GSAP CDN unavailable (`typeof gsap === 'undefined'`): falls back to the
     existing, known-working `triggerCelebration()`.
   - Any other runtime error inside `triggerCelebrationV2()`: caught, legacy
     elements restored, falls back to `triggerCelebration()`. Never leaves a
     broken/half-built overlay visible.
   - Each `<img>` gets `onerror` (hide element) before `src` is set, same
     defensive pattern as v1 — a missing celebration PNG doesn't produce a
     broken-image icon or stall the GSAP timeline.

### Explicit re-verification (per this checkpoint's required checks)
- `node --check` passed on the extracted inline `<script>` block.
- `grep -n "let orbitMarkerEls\|let orbitCurrentEl\|let orbitTrackLength"` →
  exactly one hit each, unchanged from Checkpoint 3.
- `?celebrate=1` (no `visual` param) still resolves to `triggerCelebration()`
  — confirmed by reading `initCelebrateTestHook()`.
- `?celebrate=1&visual=v2` resolves to `triggerCelebrationV2()` — confirmed
  by reading the same function; this is the only code path that can reach
  `triggerCelebrationV2()`.
- `maybeTriggerRealCelebration()` body is unchanged from Checkpoint 3 and
  still calls only `triggerCelebration(...)` — the real 100K trigger does
  **not** use v2 yet, as instructed.
- `CELEBRATION_FLAG_KEY` / `gtm_celebrated_100k` is read/written only inside
  `safeLocalStorageGet`/`safeLocalStorageSet`/`maybeTriggerRealCelebration`
  — grepped, no new read/write sites were added for v2 or the test hook.
- No API keys, tokens, or secrets appear anywhere in `index.html` (grepped
  for `api_key`/`apikey`/`secret`/`token`, only comment text matched).
- `triggerCelebration()`'s own function body was diffed against its prior
  version and is byte-for-byte identical.

**Not touched, as instructed:** `api/og.js`, `api/videos.js`, `api/stats.js`,
homepage layout, Gravity Rail / orbital ring visuals, milestone math,
`vercel.json`, `package.json`. No legend was added. The default/current
celebration was not removed or altered.

### Known limitations of this prototype (flagging for follow-up, not fixed now)
- **Performance risk:** animating 12 full-resolution PNGs with `filter: blur()`
  simultaneously during the pull-in phase is the most GPU-expensive part of
  this sequence. It's usable for QA but I'd want a real device test (mid-range
  Android) before this becomes the default. A cheap follow-up would be a
  smaller (~200px-wide) thumbnail variant of the 12 images used only for this
  effect.
- The v2 sequence is entirely timeline-scripted (fixed second offsets like
  `3.2`, `5.8`, `6.6`, `8.0`); it does not yet adapt its pacing to
  `images.length` beyond the initial stagger — fine for the fixed 12-image set
  today, would need revisiting if the celebration asset count ever changes.
- `triggerCelebrationV2()` is intentionally not wired into
  `maybeTriggerRealCelebration()` — per this checkpoint's explicit scope. That
  wiring, plus a decision on whether v2 fully replaces v1 or becomes a config
  toggle, is a future checkpoint's call, not this one's.
- Still open from prior checkpoints (unchanged this session): verify the
  Spectral font URL in `api/og.js` at deploy time; `celebrationImages` still
  includes `09.png`/`12.png` captioned for a past "10K" milestone; the stray
  root-level `videos.js` duplicate of `api/videos.js` is still unexplained and
  still out of scope to touch.
