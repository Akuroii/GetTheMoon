# Final Production Review — GetTheMoon V2

*Reviewed as lead reviewer, not as the author. Everything below reflects
actual verification — commands run, output read — not confidence claims.*

---

## Critical issues

**One found, and fixed during this review — not present in the shipped code below.**

`Pill` (used for the milestone progress readout, stats, and social links)
only destructured four named props and never forwarded anything else.
`MilestoneCarousel` passes `aria-live="polite"` to it, intending the
progress readout to be announced to screen readers on update. TypeScript
allows `aria-*` attributes on any JSX component by default — that's a
type-level convenience, not a guarantee the component honors it — so
`tsc` reported zero errors while the attribute was silently dropped at
runtime. The accessible-source-of-truth comment next to that call site was
describing behavior that didn't actually exist.

Fixed by having `Pill` forward unrecognized props via `HTMLAttributes<HTMLElement>`
rather than a closed prop list. Also hardened `GlassPanel` the same way
preemptively — same latent pattern, no current caller was actually
affected, but it's the exact shape of bug that just proved it can happen
silently.

**Nothing else met this bar.**

---

## Recommended improvements (can wait)

- **`assets/meteor.svg` and `meteor-cursor.png` were never actually wired
  in**, despite earlier notes calling them out for reuse. The current
  position marker and orbit dots are fresh inline SVG that evokes similar
  visual language, not the literal approved file. Not broken — just not
  what was earlier committed to. Worth a deliberate decision: swap in the
  real asset, or formally accept the inline version as the actual design.
- **~3.4MB of assets sit unreferenced in `public/`** — the full celebration
  montage, blackhole video, and poster. Expected and correct, given
  Celebration is explicitly deferred, not a mistake — flagging only so it
  doesn't look like an oversight when this repo is reviewed later.
- **Avatar is hotlinked from YouTube's CDN rather than self-hosted.** Your
  explicit call, tradeoffs already explained before implementing. Revisit
  if YouTube's CDN reliability or the resolution cap ever actually becomes
  a problem in practice — not before.

## Nice-to-have improvements

- Self-hosting the four Google Fonts as static files would remove the
  only external network dependency `next build` has left. Not necessary —
  Vercel's build environment has normal internet access — but it would
  make local development fully offline-capable.
- No `twitter:card` meta tag alongside the `/api/og` route — the dynamic
  image works, but an explicit tag guarantees certain platforms pick the
  large-image card layout rather than guessing.

## Technical debt

- **Zero automated tests.** Nothing here was asked to include a test
  suite, so none exists — worth naming plainly as debt rather than a
  silent gap, especially for `lib/milestones.ts`'s pure functions, which
  are the cheapest possible thing to unit test and the one place a
  regression (the 0/0 division class of bug) has already happened once, in V1.
- **No CI workflow.** Lint, type-check, and build all currently only run
  when a human remembers to run them. A GitHub Actions workflow that runs
  on every PR is unrelated to the *scheduled cron* trigger this project
  deliberately avoids (§3 of `DEPLOYMENT.md`) — a checks-on-PR workflow
  doesn't have the 60-day-inactivity problem, only the `schedule` trigger
  does.
- **Shorts classification is a heuristic**, permanently — documented
  clearly in code and `DEPLOYMENT.md`, not hidden, but it's real,
  ongoing debt in the sense that YouTube could change what makes this
  heuristic accurate at any time without notice.

---

## Security review

- Grepped the entire source tree for key-shaped strings
  (`AIza[0-9A-Za-z_-]{35}`): none found.
- Every `process.env.*` reference cross-checked against `.env.example`:
  exact 1:1 match, nothing missing or stale.
- Checked every file containing `"use client"` for any reference to
  `YOUTUBE_API_KEY`, `DATABASE_URL`, or `INGEST_SECRET`: none.
- `lib/youtube.ts` (the only file that reads `YOUTUBE_API_KEY`) is
  imported exclusively by `lib/ingest.ts`, which is imported exclusively
  by `/api/ingest` (POST, secret-protected) and the local test script —
  never by a route the browser calls.
- `/api/ingest` correctly returns `401` for a missing/wrong
  `Authorization` header — this is on the post-deployment checklist in
  `DEPLOYMENT.md` specifically because it's worth confirming by hand
  against the real deployment, not just trusting the code read.
- `next.config.mjs`'s `remotePatterns` are scoped to the three specific
  YouTube CDN hosts actually in use, not a wildcard.

No open findings.

## Performance review

- Real bundle measurement, not an estimate: **708KB total client JS**
  across all chunks, largest single chunk 224KB. Confirmed the three
  removed unused dependencies (`gsap`, `motion`, `@base-ui/react`) were
  never in these numbers to begin with — the bundler already tree-shook
  them correctly since nothing imported them. Removing them from
  `package.json` is an install-time and maintenance-clarity fix, not a
  bundle-size win that already happened.
- Every `@keyframes` in the project animates only `transform` and
  `opacity` — checked all seven, none touch `box-shadow`, `filter`,
  `width`, or `background` inside the animation itself. The milestone
  marker's blur glow is a second, static (non-animated) SVG circle
  layered under the pulsing one, not the same element being animated and
  filtered simultaneously.
- Starfield's canvas loop had no `visibilitychange` handling — browsers
  already throttle background-tab `requestAnimationFrame` as standard
  behavior, so this wasn't a severe issue, but it now explicitly cancels
  and resumes rather than relying on that implicit behavior.
- Server Components ship zero JS by default; verified `AnimatedNumber` and
  `SubscriberCount` are the only client boundaries in the design-system
  layer, everything else in `components/ui` stays server-rendered.

## Accessibility review

- Computed real WCAG contrast ratios (not estimated) for every color pair
  in the design system: all seven pass AA for normal text, several clear
  AAA. Lowest is `--violet` on `--bg` at 5.22:1 against a 4.5:1 bar.
- Fixed: the milestone progress readout's `aria-live="polite"` now
  actually reaches the DOM (see Critical Issues above).
- Every decorative layer (`Atmosphere`, `OrbitRing`, `OrbitingBody`,
  `GravityParticles`, the SVG progress path) is `aria-hidden`; the
  accessible content lives in real text elsewhere, matching the design
  spec's original "the path is decorative, the readout is the source of
  truth" principle.
- Timeline nodes: real 44×44px tap target around a smaller 12px visual
  marker (per current touch-target guidance), keyboard-focusable, Escape
  closes and returns focus to the triggering node.
- Language control is a static label, not a non-functional button —
  confirmed this was actually fixed in a prior pass, not just described
  as fixed.

No open findings at this pass.

## Final production checklist

- [x] `npm install` — clean
- [x] `npx tsc --noEmit` — zero errors
- [x] `npm run lint` — zero errors (after fixing `next lint`'s removal in
      Next.js 16 and an ESLint 10 / `eslint-config-next` incompatibility,
      both real, both documented in the previous session)
- [x] `npm run build` — clean, verified with fonts isolated due to this
      sandbox's network restrictions (not a code issue — explained and
      isolated in a prior pass, unchanged since)
- [x] Every database query tested against a real local Postgres instance,
      including the reconciliation `DELETE`, not just statically typed
- [x] No secrets reachable from client code
- [x] Every component has a real importer; no orphaned files
- [x] No unused dependencies remain in `package.json`
- [x] `DEPLOYMENT.md` exists and covers env vars, DB setup, cron
      configuration, Vercel settings, first-deploy steps, a post-deploy
      checklist, and troubleshooting
- [ ] Real avatar/YouTube credentials — cannot be verified from this
      sandbox; first real ingestion run is the actual proof, per
      `DEPLOYMENT.md`'s post-deployment checklist

---

**I would deploy this to production.**

The one critical finding was caught and fixed inside this same review, not
left for you to discover after launch — everything documented above
reflects the code as it now stands, verified, not as a promise.
