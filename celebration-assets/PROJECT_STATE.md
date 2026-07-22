# PROJECT_STATE — GetTheMoon

> No PROJECT_STATE.md existed in the files provided for this session, so this
> is a fresh file starting from Checkpoint 3. Prior checkpoint history below
> is reconstructed from SESSION_NOTES.md and README_DEPLOY.md that were
> supplied alongside the code — treat anything before "Checkpoint 3" as
> best-effort history, not a verified log.

## Known-working, as of Checkpoint 3
- Homepage loads and renders (Checkpoint 1 fixed a TDZ crash in
  `orbitMarkerEls`/`orbitCurrentEl`/`orbitTrackLength`).
- `/api/stats` returns real JSON.
- `/api/videos` returns real JSON.
- `/api/og` returns a working OG image (NaN-at-100K bug and missing-avatar
  guard already fixed per SESSION_NOTES.md).
- Orbital milestone track, carousels, timeline, celebration overlay, i18n
  (EN/AR) all functioning per SESSION_NOTES.md.

## Checkpoint 3 — Celebration reliability (this session)

**Follow-up hardening patch (same checkpoint, post-external-verification):**
Added `realCelebrationTriggeredThisSession` (in-memory `let`, false by
default) to `maybeTriggerRealCelebration()`. Without it, a browser with
localStorage blocked/unavailable and subscribers already >= goal would
replay the celebration on every poll (`CONFIG.pollMs`), since
`safeLocalStorageSet()` silently no-ops when storage isn't writable. Now the
function checks the in-memory flag first, then the persisted flag; the
in-memory flag is set immediately before `triggerCelebration()` is called,
and `safeLocalStorageSet()` is still attempted afterward so the flag
persists across reloads whenever storage *is* available. Nothing else in
this function changed. `?celebrate=1` still bypasses this function entirely
and does not touch either flag.

**Touched:** `index.html` only. Nothing else in the repo was modified.

Changes:
1. **Real 100K gating, now actually persistent.** Previously the "crossing"
   check (`lastSubs !== null && lastSubs < goal && data.subscribers >= goal`)
   only worked within a single page session — `lastSubs` resets to `null` on
   every reload, so it could never fire if a visitor loaded the page after
   the channel had already crossed 100K, and it offered no cross-session
   dedupe. Replaced with `maybeTriggerRealCelebration(subscribers, goal)`,
   which checks `localStorage['gtm_celebrated_100k']` and only fires once
   ever per browser (live crossing during a session, or first load already
   past goal — either way, fires once, then never again). All localStorage
   access goes through `safeLocalStorageGet`/`safeLocalStorageSet`, which
   swallow exceptions (private browsing, disabled storage, some in-app
   browsers) so a storage failure degrades to "celebration doesn't persist
   across reloads," never to a crash.
2. **`?celebrate=1` test hook.** Visiting `/?celebrate=1` calls
   `triggerCelebration()` directly after a short delay, for manual QA. It
   never touches `maybeTriggerRealCelebration()` or the
   `gtm_celebrated_100k` flag — verified by reading the code path, the test
   hook and the real gate are entirely separate functions with no shared
   state beyond the celebration UI itself.
3. **Defensive image handling in the montage.** Each celebration `<img>`
   now gets `onerror` before its `src` is set, so a missing/404'd file just
   hides that frame instead of showing a broken-image icon. The GSAP tween
   was already safe here (it animates the element, not a load event) but
   this closes the one remaining visible failure mode.
4. Both new declarations (`CELEBRATION_FLAG_KEY` and the helper functions)
   are placed as **hoisted `function` declarations**, not `const`/`let`
   assigned later, specifically to avoid the class of bug that caused the
   Checkpoint 1 outage (a value referenced before its `let` initialization
   in execution order).

**Explicit re-verification (per instruction #7):**
- `orbitMarkerEls`, `orbitCurrentEl`, `orbitTrackLength` — exactly one `let`
  declaration each, still at their original location above `applyLang('en',
  false)`. Confirmed via `grep -n "let orbitMarkerEls\|let orbitCurrentEl\|
  let orbitTrackLength" index.html` → one hit each.
- New top-level bindings added this session: `CELEBRATION_FLAG_KEY` (const),
  `safeLocalStorageGet`/`safeLocalStorageSet`/`maybeTriggerRealCelebration`
  (function declarations, hoisted — order-independent), and the
  `initCelebrateTestHook` IIFE (self-contained, no external `let`/`const`
  read before assignment). None of these are referenced anywhere in the
  script before their own definition point.
- `node --check` passed on the extracted inline `<script>` block.

**Not touched, as instructed:** `api/og.js`, `api/videos.js`, `api/stats.js`,
Gravity Rail / orbital ring visuals, homepage layout, milestone math,
`vercel.json`, `package.json`.

## Known gap in this deliverable
This session had no access to the actual binary assets (`assets/celebration/
*.png`, `assets/celebration/ambient.mp3`, `assets/meteor-32.png`,
`assets/meteor-180.png`, `assets/meteor-cursor.png`) — only their filenames
as referenced in code. The ZIP for this checkpoint therefore ships
`index.html` (patched) plus the other text-based files exactly as provided
in the source documents. **Do not deploy this ZIP over your existing
`assets/` folder** — merge only `index.html` into your existing project, the
same way Checkpoint 1 was deployed.

## Still pending / flagged for follow-up (not part of this checkpoint's scope)
- Verify the Spectral font URL in `api/og.js` at deploy time (still open
  per SESSION_NOTES.md — not re-verified this session since OG was
  explicitly out of scope).
- `celebrationImages` still includes `09.png`/`12.png`, captioned for a past
  "10K" milestone, unfiltered — will surface during the real 100K
  celebration too. Worth a deliberate check before the real milestone hits.
- There is a stray root-level `videos.js` duplicating `api/videos.js`
  byte-for-byte. It isn't matched by `vercel.json`'s `api/**/*.js` function
  pattern, so it shouldn't currently execute as a serverless function — but
  a duplicate of API logic sitting outside `api/` is worth a deliberate
  decision (delete it, or confirm it's intentionally there for something)
  rather than leaving it unexplained. Flagging only — out of scope to touch
  this session per "do not touch APIs."
