# GetTheMoon Checkpoint 01 — Homepage Runtime Hotfix

This package fixes the homepage JavaScript crash that keeps the live page stuck at `0` subscribers and `loading…` videos.

## What changed

Only `index.html` changed.

The orbit state declarations were moved above `applyLang('en', false)` because `applyLang()` calls `renderMilestone()`, and `renderMilestone()` uses `orbitMarkerEls`.

Before this fix, the browser throws:

```txt
ReferenceError: Cannot access 'orbitMarkerEls' before initialization
```

That error stops the script before `/api/stats` and `/api/videos` are fetched.

## Files in this ZIP

- `index.html` — patched full homepage file fetched from the current live site
- `getthemoon_orbit_tdz_hotfix.diff` — minimal unified diff
- `README_DEPLOY.md` — this file

## IMPORTANT deployment instruction

Do **not** replace your whole repo with only this ZIP.

Use this package to replace only your existing root `index.html` in the current Vercel project/repo.
Keep your existing `api/` folder, assets, package.json, and environment variables exactly as they are.

## Verification after deploy

Check:

1. `https://getthemoon.vercel.app/` no longer stays at `0`.
2. Recent uploads no longer stay on `loading…`.
3. Browser console has no `Cannot access 'orbitMarkerEls' before initialization` error.
4. `https://getthemoon.vercel.app/api/stats` still returns real JSON.
5. `https://getthemoon.vercel.app/api/videos` still returns real JSON.

## Still pending after this checkpoint

- `/api/og` still returns 404 and needs Checkpoint 02.
- Celebration images/audio should be checked after homepage runtime is stable.
- SEO files should be added later.
- Design/spacing polish should wait until the site is stable.
