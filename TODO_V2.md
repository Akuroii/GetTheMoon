# Deferred to a Later Pass

Everything here was intentionally postponed, by explicit decision, not
discovered as a gap during review. Organized roughly by area, not by
priority — priority is your call, not something to presume here.

## Celebration system

Explicitly skipped for this pass, to be built later as a separate feature.
When it is:
- V1's unshipped `triggerCelebrationV2` prototype (Journey → Black Hole →
  Darkness → Moon reveal) is the existing creative direction to build on,
  not start over from.
- Two of the twelve celebration images (`09.png`, `12.png`) are captioned
  for a past "10K" milestone — need retiring or replacing before reuse at
  500K scale, not reused as-is.
- `gsap` and `@base-ui/react` were removed from `package.json` during the
  production review specifically because Celebration was the only planned
  use for them and it isn't built yet — re-add both when this starts.
  `@base-ui/react` specifically for a properly focus-trapped modal, rather
  than hand-rolling dialog accessibility the way V1 did.

## Full EN/AR localization

Explicitly Phase 2. Currently: the header shows a static "EN" label, not
a functional toggle — a deliberate choice over shipping a button that does
nothing on click. V1's complete, real bilingual `STRINGS(en/ar)` object
was confirmed to exist and work in the original codebase; it's a real
asset to port, not something to write from scratch, when this phase
starts. RTL layout (logical CSS properties throughout, bidi text handling)
is the harder half of this and hasn't been scoped in detail yet.

## Avatar caching/self-hosting

Currently hotlinked directly from YouTube's CDN
(`avatar_url_youtube`, synced on every ingestion run). Explained tradeoffs
before implementing it this way: resolution capped around 800×800 by
YouTube's API, an external CDN dependency at request time, no manual
override if you ever want the site to intentionally differ from the live
YouTube PFP. Self-hosting a synced copy (e.g., via Vercel Blob, downloaded
and stored during ingestion) would remove all three tradeoffs at the cost
of standing up real storage infrastructure. Revisit if CDN reliability or
the resolution cap ever actually matters in practice — not preemptively.

## Future animations

- The Celebration sequence's actual motion design (depends on that
  feature existing first).
- Nothing else animation-related is currently incomplete — see
  `FINAL_REVIEW.md`'s Performance Review for what's already built and
  verified (every keyframe is `transform`/`opacity`-only, Starfield
  properly pauses off-screen).

## Additional analytics

None currently implemented beyond what YouTube's own API provides
(subscriber count, view counts, per-video stats). No first-party analytics,
no event tracking on interactions (timeline node opens, carousel steps,
outbound social clicks) — all of that is a deliberate non-feature right
now, not a gap that was missed.

## Performance optimizations

- **`/api/og` has no `Cache-Control` header** — every request re-queries
  Postgres and re-renders the image from scratch, even though this route
  is mostly hit by infrequent social-crawler fetches rather than regular
  traffic. Small, real, low-urgency (see `FINAL_REVIEW.md`).
- **No pagination on `/api/timeline`** — `VISIBLE_LIMIT = 40` is a hard
  cap, not a `?page=` parameter. Fine for the current, recent content
  volume; will need a real "expand journey" endpoint if/when visitors
  should be able to browse the full history rather than just the sliding
  window.
- **Fonts load via `next/font/google`'s runtime fetch, not self-hosted
  static files** — works fine on Vercel (normal internet access), adds
  one external network dependency to the build that self-hosting would
  remove. Not necessary, just an option.

## Accessibility enhancements

Current state is genuinely solid (see `FINAL_REVIEW.md`'s Accessibility
Review — computed contrast ratios, working `aria-live`, real touch
targets, full keyboard support on timeline nodes). Nothing currently
broken is deferred here. What's *not yet built* because the features
themselves aren't built:
- No screen-reader-specific announcement for the Celebration sequence
  (can't build this until Celebration itself exists).
- No RTL-specific accessibility testing (can't test until real Arabic
  localization exists).

## Technical debt carried forward from the production review

(Full detail in `FINAL_REVIEW.md` — summarized here for visibility in one
place.)

- Zero automated tests. `lib/milestones.ts`'s pure functions are the
  cheapest, highest-value place to start.
- No CI workflow running lint/typecheck/build on PRs.
- `assets/meteor.svg` and `meteor-cursor.png` were approved for reuse
  early in this project but the shipped current-position marker is fresh
  inline SVG in the same visual language, not the literal file — an open
  decision, not a bug, still unresolved as of this document.
