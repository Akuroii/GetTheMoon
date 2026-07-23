# GetTheMoon — Fresh Start: real black hole, asteroid belt, new markers

## What this replaces
- The CSS-fake "black hole" (conic-gradient ring) in the celebration → your
  actual `blackhole.mp4` (4K accretion-disk render), processed into a small,
  seamless, boomerang loop (forward+reverse, so there's no jump-cut) at
  ~300KB. It never loads on a normal page visit — `preload="none"`, the
  `src` is only set the moment a celebration actually fires.
- The full-ring "orbital gauge" wrapped around the avatar → a horizontal
  **asteroid belt** below the subscriber count (the direction you picked).
  Same underlying math pattern as before (SVG path + `getPointAtLength`),
  just a shallow arc instead of a circle, so it's a separate, readable
  "progress" element instead of decoration wrapped around your face.
- The single reused meteor rock (favicon, cursor, milestone markers) → three
  small ringed-planet icons (violet → pink → gold, matching the belt's own
  gradient, so the colour tells you which stage of the journey a milestone
  is at) plus a distinct comet icon for "you are here," and a mini moon icon
  at the goal. Also became the new favicon / apple-touch-icon / cursor.
- The split `triggerCelebration()` / `triggerCelebrationV2()` (a shipped
  default plus a hidden `?visual=v2` prototype) → one celebration function.
  There's no more "which one actually runs" ambiguity.

## Celebration sequence (unchanged story, real assets now)
Black hole video fades in → your 12 real celebration images orbit it → they
get pulled into the event horizon → darkness → a **live clone of the site's
own moon** (not a new asset) reveals itself → the existing text/copy.
Fallbacks, in order: `prefers-reduced-motion` gets the poster frame + moon +
text with zero motion; no GSAP gets the real assets without choreography;
any runtime error gets a calm, safe reveal instead of a broken overlay.

## Files in this delivery
- `index.html` — full replacement.
- `assets/meteor.svg`, `meteor-32.png`, `meteor-180.png`, `meteor-cursor.png`
  — new comet-based icon set, same filenames as before (drop-in replacement).
- `assets/celebration/blackhole-loop.mp4` (+ `.webm` spare) and
  `blackhole-poster.jpg` — new files, add them alongside your existing
  `assets/celebration/*.png` and `ambient.mp3` (untouched, still referenced
  by the same filenames).

## Deploy
Only `index.html` and the `assets/` files above change. **Don't touch**
`api/stats.js`, `api/videos.js`, `api/og.js`, `vercel.json`, or
`package.json` — untouched, still working, out of scope here. Keep your
existing `assets/celebration/01–12.png` and `ambient.mp3` where they are.

## Verify after deploy
1. `/` loads normally and the belt animates in under the subscriber count.
2. `/?celebrate=1` shows the black hole video, images orbiting → pulled in →
   darkness → moon → text. Click/Escape closes it cleanly (no leftover
   overlay elements, video pauses).
3. Toggle OS "reduce motion" and reload `?celebrate=1` — should be a calm,
   static reveal with no video playback.
4. Favicon/tab icon now shows the comet, not the old rock.

## Honest limitations / what I couldn't do here
- I don't have your actual `assets/celebration/01–12.png` or `ambient.mp3`
  files in this environment, only their filenames — same as every prior
  checkpoint. The code path (fade-in, pull-to-center, `onerror` hiding) is
  unchanged and tested against that assumption, but I couldn't visually
  confirm the montage timing against your real images.
- My sandbox's network is locked to a small allowlist (npm/pip/GitHub), so I
  couldn't spin up a real browser to screenshot this end-to-end. I did:
  syntax-check the extracted JS, confirm every `id` the script references
  exists in the HTML, confirm all tags balance, and reason through the
  animation timeline/z-stacking by hand — but a first real load in your
  browser is still the real test. If something looks off, tell me what you
  see and I'll fix it directly rather than guessing.
- Still open from earlier checkpoints, unrelated to this change: verify the
  Spectral font URL in `api/og.js` at deploy time; `celebrationImages` still
  includes `09.png`/`12.png` captioned for a past "10K" milestone and will
  surface during the real 100K celebration too — worth a last look before
  you actually hit 100K.

## What I'd ask you for next (only if you want to go further)
- Your real `assets/celebration/*.png` so I can tune the orbit-and-pull
  timing to how those specific images actually look together, instead of
  reasoning about it generically.
- Whether you want the PixVerse clip or the other loop used anywhere (e.g.
  as a "getting close" teaser before you hit 100K) — not used in this pass
  since you picked the blackhole.mp4 as the one celebration centerpiece.
