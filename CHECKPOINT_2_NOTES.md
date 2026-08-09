# Checkpoint 2 — Favicon correction + timeline/footer + full visual polish

Builds on Checkpoint 1 (foundation fixes + 500K). This checkpoint replaces
`index.html` again — everything below is additive on top of Checkpoint 1's
changes, nothing from that checkpoint was reverted.

## 1. Favicon — corrected per your follow-up

You were right to flag it — the favicon/apple-touch-icon now use your
character avatar, not the comet. Generated at the exact same pixel sizes as
the files they replace (32×32 with real alpha transparency in the corners
so it sits cleanly in light or dark browser tabs; 180×180 opaque, since
Apple's own guidance is to avoid transparency there — iOS applies its own
rounding and backdrop). The source image was already an inscribed circle
filling its full 600×600 canvas, so no cropping was needed, just a clean
resize.

The cursor easter egg (`assets/meteor-cursor.png`) still uses the small
comet glyph, not the character — a detailed portrait would just read as a
blurry smudge at 28px, and the cursor is more of a themed decoration than a
brand mark. Say so if you'd rather unify it anyway.

## 2. Timeline

- **Month-axis labels** under the track, with tick marks. Thinned
  automatically past ~7 labels (same crowding logic as the belt markers) —
  today's ~2-month span won't trigger it, but it won't break if your
  history grows.
- **Bigger tap targets without bigger dots.** Each dot's visible size is
  unchanged (10px, 14px for the latest upload) — a literal 44px dot would
  wreck the "density = upload frequency" visual entirely. Instead each dot
  got an invisible 34px hit-zone centered on it. Adjacent dots in a tight
  cluster can still overlap hit-zones slightly — that's an inherent
  trade-off of a dense, accurately-dated timeline, not something a bigger
  target size can fully solve.
- **Popup cards can no longer run off narrow screens.** On hover/focus, a
  card near the left or right edge now measures itself and nudges back
  on-screen if it would spill past the viewport.
- **Deliberately not done: horizontal scroll for very dense timelines.**
  Vertically overflowing hover-cards inside a horizontally-scrolling
  container need real testing to get right (getting it wrong means the
  card gets silently clipped) and I don't have a live browser here. Today's
  ~28-video timeline isn't cramped enough to need it yet. Flagging so it
  doesn't get lost, not shipping it half-verified.

## 3. Footer

Divider above it, matching your five platform links as small icons (44px
tap target, 30px visual — same invisible-expansion technique as the
timeline dots), and a fixed back-to-top button (bottom-right, fades in
after you scroll past roughly one screen height, respects reduced motion
by skipping the smooth-scroll and jumping instantly).

## 4. Visual polish — the full Section 4 list

- **Moon:** slow 130° rotation (~130s per turn) on the crater surface only
  — the outer circle is rotation-invariant so there's no seam. Deeper glow,
  subtle `scale(1.02)` on hover.
- **Video cards:** glassmorphism (`backdrop-filter: blur(12px)` over a
  translucent surface color) and a violet-to-transparent gradient border on
  hover, via the same two-layer-background technique used for the pills. A
  play-icon fades in over the thumbnail on hover.
  **Worth knowing:** `backdrop-filter` is one of the more GPU-expensive CSS
  properties, and there are up to ~12 cards on screen at once across both
  carousels. Modern devices handle this fine; if you ever notice scroll
  jank on an older phone, dropping `backdrop-filter` while keeping the
  translucent color is a one-line, still-attractive fallback.
- **Platform pills:** simple generic glyphs (not the platforms' actual
  logo art — a rounded play button, a music note, a chat bubble, a
  lowercase "f") so there's no trademark/brand-asset concern, just enough
  to read at a glance. Reused in the footer's social row too, so it's one
  icon set, not two.
- **Carousels:** hover-revealed arrow buttons on desktop, hidden entirely
  on touch devices (`@media (hover: none)`) since swipe already works
  there and permanent floating arrows would just sit on top of the first
  and last card with nothing to reveal them cleanly. Scrollbar is now a
  violet-to-pink gradient instead of a flat line color.
- **Background:** dust particles are now a mix of gold/violet/pink (was
  solid gold), matching the palette already used for the falling meteor
  streaks — one atmosphere system instead of two. A static SVG-noise grain
  layer sits over everything at 3% opacity, `mix-blend-mode: overlay` — no
  image download, negligible cost.
- **Typography:** soft violet glow on the h1, a ✦ before the eyebrow text
  (added via `::before` so it doesn't need duplicating across the EN/AR
  string tables).
- **Touch targets:** every previously-sub-44px control (language toggle,
  belt's ‹› stepper, footer social icons, back-to-top) now has a real 44px
  hit-zone via the same invisible-expansion technique, without growing any
  of them visually. One exception, deliberately: the cursor-easter-egg
  toggle stays visually tiny (it's meant to be obscure) but got a 36px hit
  zone so it's actually usable once someone finds it.
- **Staggered reveal on scroll:** the three main sections (recent uploads,
  fan favorites, timeline) fade up as they enter the viewport, via
  `IntersectionObserver` — no scroll-event polling. Reduced motion shows
  everything immediately with no transition at all, not just a faster one.

## 5. Repo cleanup — updated list

Everything from Checkpoint 1's list still applies, **plus** three more
files that are now orphaned by the favicon correction:

```
celebration-assets/          (from Checkpoint 1 — still applies)
videos.js                    (from Checkpoint 1 — still applies)
blackhole-loop.mp4           (from Checkpoint 1 — still applies)
blackhole-poster.jpg         (from Checkpoint 1 — still applies)
meteor-180.png               (from Checkpoint 1 — still applies)
meteor.svg                   (root — was only needed to seed the favicon
                               fix, now fully superseded)
assets/meteor.svg            (new this checkpoint — replaced by
assets/meteor-32.png          assets/favicon-32.png and
assets/meteor-180.png         assets/favicon-180.png; meteor-cursor.png
                               is the one meteor asset still in use)
```

## What's in this zip

Only `index.html` changed this checkpoint, plus the two new favicon PNGs.

```
index.html                    (updated — supersedes Checkpoint 1's copy)
assets/favicon-32.png         (new)
assets/favicon-180.png        (new)
CHECKPOINT_2_NOTES.md
```

Everything from Checkpoint 1's zip (`api/*.js`, `vercel.json`, `package.json`,
`package-lock.json`, `robots.txt`, `sitemap.xml`, the moved celebration
video/poster) is unchanged and still applies — this zip doesn't repeat those
files.

## Verified before packaging

- `node --check` passes on the extracted inline `<script>` block.
- Every `getElementById` call in the script (48 total) has a matching
  element in the HTML — checked programmatically, not by eye.
- Tag balance checked for every structural element type (div, button, svg,
  section, header, footer, style, script) — all matched.
- The Checkpoint-1 TDZ fix is still intact — `beltMarkerEls`/`beltCurrentEl`
  still declared before `applyLang('en', false)` runs.
- No stray references to the removed meteor icon files — only the cursor
  easter egg (still in use) and the JS variable names for the falling
  meteor-streak animation (unrelated to any image file) remain.

## Honest limitation

Same as last checkpoint: no live browser here, so this is verified by
reading the code, checking references programmatically, and rendering the
new icon assets directly to confirm they look right — not by watching the
page actually run. The one place I'm least certain without a real device is
the RTL pass — you asked for that check explicitly, and I'd genuinely like
you to load `?lang` toggled to Arabic (or however you trigger it) and tell
me if anything looks off, especially the new footer row and carousel
arrows, before I'd call this checkpoint fully done.

## Next up

Section 5's remaining items are manual dashboard/account steps, not code —
still waiting on you for those (Google Cloud Console API restriction,
Vercel Firewall rate-limit rule, CSP Report-Only console check). Everything
in your original list that *could* be done in code now has been. Let me
know what you want to look at next, or if anything in a live load doesn't
match what these notes describe.
