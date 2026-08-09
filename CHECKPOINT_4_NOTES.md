# Checkpoint 4 — Fixed the invisible timeline title + added accent sparkle stars

Small, targeted fix. Only `index.html` changed.

## 1. The invisible text — root cause, not a patch

`<button>` elements don't inherit text color from the page by default —
browsers give them their own default (usually dark) button-text color
unless a page's CSS overrides it. `.vcard` already had `color:inherit` for
exactly this reason; `.timeline-dot` never did. Its `.date` and `.views`
happened to have their *own* explicit colors, so they looked fine — `.title`
didn't, so it fell back to the browser's default dark text on a dark card,
which is exactly what your screenshot showed. This bug predates this
session — it was already in the file before Checkpoint 1 — I just hadn't
had a reason to look at that specific popup rendered until you showed me.

Fixed the same way `.vcard` already handles it: added `color:inherit;
font:inherit;` to `.timeline-dot` itself, so everything inside the popup
correctly inherits the page's actual light text color. One-line cause, and
I audited every other button on the page afterward (the language toggle,
belt stepper, back-to-top, carousel arrows, belt markers) to confirm none
of them have the same gap — they all either set their own color explicitly
or were already covered.

## 2. Accent sparkle stars

Added a small number of brighter, 4-point "glint" stars mixed into the
existing plain dot field — same soft-glow-plus-cross-lines look as your
reference image, but recolored to this site's own violet/pink/gold/white
instead of the reference's blue, since you said matching the current site
mattered more than matching the photo exactly. Count scales with screen
size (roughly 3 on a phone, up to 16 on a large desktop) so it stays an
accent, not clutter, on any screen. Same twinkle behavior as the existing
stars, same reduced-motion handling (static, no pulse).

I rendered the actual shape at both a large preview size and the true
~3px on-page size before committing to it, rather than trust the geometry
math blind — given what just happened with the text color, "I calculated
it should look right" isn't good enough on its own anymore.

## Verified

- `node --check` on the extracted script — passes.
- All structural tags still balanced.
- `triggerCelebration`/`closeCelebration`/`buildMoonClone` still present,
  untouched — checked again, same as every checkpoint.
- Audited every button element on the page for the same missing-color
  pattern that caused this bug — nothing else affected.

## What's in this zip

```
index.html              (updated — supersedes Checkpoint 3's copy)
CHECKPOINT_4_NOTES.md
```
