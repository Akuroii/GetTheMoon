# Checkpoint 7 — Repo hygiene: stale files, .gitignore

Covers audit findings L1 and L2. This is the last checkpoint from the audit's fix
checklist — everything remaining after this is dashboard/account work with no code
lever, listed at the bottom so it's all in one place.

**Touched:** one new file, `.gitignore`. Everything else in this checkpoint is
instructions, because a zip genuinely cannot delete anything from your repo — every
earlier checkpoint that hit this same wall handled it the same way.

## Please delete these from your repo

All six confirmed still present on `main` when I cloned it for the audit, despite
being flagged across Checkpoints 1, 2, and this audit:

```
videos.js                         (root — stale duplicate of api/videos.js; still has
                                    the hardcoded fallback channel ID and lacks the
                                    CORS lock + validation that api/videos.js has)
meteor.svg                        (root — superseded by assets/meteor.svg)
meteor-180.png                    (root — superseded by assets/meteor-180.png)
blackhole-loop.mp4                (root — superseded by assets/celebration/ copy)
blackhole-poster.jpg              (root — superseded by assets/celebration/ copy)
getthemoon_orbit_tdz_hotfix.diff  (root — an internal dev patch file, no reason to
                                    ship it in a public repo)
```

None of these run as live routes or affect the deployed site's behavior either way —
this is about not shipping a weaker, dead copy of your own logic and not exposing
internal working files, not about fixing something broken.

## Worth a decision, not deleting unilaterally

`PROJECT_STATE.md`, `SESSION_NOTES.md`, `README_DEPLOY.md`, and the `CHECKPOINT_*_NOTES.md`
files are internal planning notes sitting at your repo root. I didn't put these in the
delete list above because that's a real editorial call, not a hygiene fix the way the
six files above are — you may well want this history kept, just maybe not at the
public repo root. Three reasonable options, roughly in order of effort:
- Leave them — a public dev-notes trail isn't a vulnerability, just unpolished.
- Move them into a `docs/` folder — keeps the history, tidies the root.
- Delete them — if you'd rather the repo just be the current, shipped state.

Say which and I'll act on it next round; not guessing at this one.

## `.gitignore` — new

Your repo didn't have one at all. Confirmed clean, this isn't patching a leak — I
scanned every commit on every branch during the audit and found nothing secret-shaped
anywhere. This is purely forward insurance: your commit history is mostly GitHub's
web "Add files via upload" flow rather than local `git add`, which is exactly the
workflow where a local `.env` gets dragged in by accident someday. Standard ignores
for a Node/Vercel project: `.env*`, `node_modules/`, `.vercel`, OS/editor cruft, logs.

## Still open — no code lever, this is the complete list from the whole audit

Everything below needs your hands on an actual dashboard or console — nothing left to
give you as a zip for any of these:

- **Vercel Firewall → add a rate-limit rule on `/api/*`.** Free on Hobby (one rule
  included, covering the first 1M allowed requests/month). Start it in log-only mode,
  confirm real traffic isn't affected, then switch to block. This is the one item on
  this whole list I'd actually prioritize doing soon — it's the piece that makes
  Checkpoint 5's method-allowlist fix airtight against volume, not just wrong methods.
- **Google Cloud Console → restrict the YouTube API key to "YouTube Data API v3" only.**
  Carried over from your very first checkpoint's notes — still open.
- **Google Search Console → submit the sitemap, request indexing on the homepage.**
  The site is crawlable but not yet indexed (confirmed by a live search this week) —
  there's no code-side fix for this, submission is the actual mechanism.
- **A decision on `?celebrate=1`** — the public, unauthenticated QA hook. Low impact,
  but it's a product call (keep it permanently, gate it, or remove it before you'd
  call this fully "launched") rather than something to decide for you.
- **A decision on the planning `.md` files**, above.

## Verified before packaging

- `.gitignore` doesn't reference any file path in a way that would (if it somehow
  already existed in history) retroactively "hide" a real secret — moot here since
  none exists, but checked as a matter of habit.
- Cross-checked the delete list above against the actual current file tree from the
  clone (not from memory of the audit) — all six still present, no others missed.

## What's in this zip

```
.gitignore
CHECKPOINT_7_NOTES.md
```

Nothing else changed. This closes out every code-side item from the original audit —
Checkpoints 5, 6, and 7 together cover the full fix checklist except the four
dashboard/account items and two editorial decisions listed above.
