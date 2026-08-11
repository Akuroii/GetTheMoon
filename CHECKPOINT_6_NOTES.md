# Checkpoint 6 — CSP: hash-based sources, still Report-Only + Permissions-Policy

Covers audit finding M3. **Touched:** `vercel.json` only, plus one new file:
`scripts/compute-csp-hashes.js`. `index.html` is unchanged this round.

## What changed

`script-src` and `style-src` no longer use `'unsafe-inline'`. In its place:

- `script-src` now allows exactly two SHA-256 hashes — one for the inline
  `<script type="application/ld+json">` structured-data block, one for the main
  inline app-logic `<script>` block — plus the existing `https://cdnjs.cloudflare.com`
  for GSAP.
- `style-src` now allows one SHA-256 hash, for the inline `<style>` block, plus the
  existing `https://fonts.googleapis.com` for the Google Fonts stylesheet.
- Added `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
  as its own header, cheap and with no functional risk.
- **Every other directive is byte-for-byte unchanged** — `default-src`, `font-src`,
  `img-src`, `media-src`, `connect-src`, `object-src`, `base-uri`, `frame-ancestors` are
  untouched. Diffed directive-by-directive against the pre-checkpoint policy to confirm
  this rather than eyeballing it.
- **The header key is still `Content-Security-Policy-Report-Only`.** This is not yet
  enforced — see "why it's staying Report-Only for one more round," below.

Why hashes instead of nonces (the more commonly-recommended approach): a nonce has to
be generated fresh per request and injected into both the header and the tag, which
needs a template step at request time — this site has no such step, it's static HTML
served as-is. A hash, by contrast, is a fixed value computed once from content that
doesn't change per request, which is exactly what these three blocks are. The
trade-off, and it's a real one: a hash breaks the moment the matching block's content
changes by even one byte, so it has to be recomputed on every future edit to the
inline script/style — nonces don't have that problem, but need the request-time
infrastructure this site doesn't have. Given that, the new helper script below is
what makes the hash approach's maintenance cost small instead of "recompute a SHA-256
by hand and hope you didn't fumble the whitespace" (see the next section for exactly
how close I came to doing that myself, this round).

## `scripts/compute-csp-hashes.js` — new

A ~30-line, dependency-free Node script (uses only `fs`/`path`/`crypto`, already
built into Node — no `npm install` needed). Run `node scripts/compute-csp-hashes.js`
after any future edit to the JSON-LD block, the app-logic block, or the `<style>`
block, and paste the three printed hashes into `vercel.json`.

**Why this exists, concretely:** computing these by hand means extracting the exact
byte content between `<script>`/`<style>` tags and hashing it — and CSP hashes are
sensitive to *leading* whitespace, not just content. My first extraction attempt this
checkpoint got that wrong: I wrote a regex that accidentally consumed the newline
right after the opening `<script>` tag outside the capture group, which would have
produced a hash for the wrong (truncated-by-one-character) string — silently wrong in
a way that's easy to miss by eye, since the visible content looks identical either
way. Caught it by checking the extracted content's exact boundaries before hashing,
not by trusting the first pass. The script encodes the corrected version of that
extraction so this exact mistake can't recur next time — verified its output three
independent ways: Python's `hashlib`, the `openssl` CLI, and this script's own Node
`crypto` output all agree on the same three hashes, and all three are confirmed
present verbatim in the `vercel.json` this checkpoint ships.

## Why it's staying Report-Only for one more round

Your own Checkpoint 1 notes set the right precedent here and I'm following it rather
than overriding it: ship the policy, verify it's clean on a real deployed load, *then*
flip to enforced. Concretely, after this deploys:

1. Open the live site in a browser, open DevTools → Console.
2. Reload the page, click around a bit (open the language toggle, hover a timeline
   dot, trigger the carousel arrows — anything that runs inline JS paths).
3. Look for lines containing **"Content Security Policy"** or **"CSP"**.

You'll likely see one specific, harmless line: something to the effect of *"a
Report-Only policy without a report URI... will not block and cannot report
violations."* That one's expected and not a problem — it's the browser noting there's
no server-side collection endpoint, which is fine for a manual check like this one.
**What you're actually looking for** is anything that names a *specific blocked
script or style* — that would mean a hash is wrong or something inline wasn't
accounted for, and it means don't enforce yet.

If the console is clean of the second kind of message: change the header key in
`vercel.json` from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`
— that's the entire remaining step, one word. Say so and I'll do that flip and confirm
it once more before you redeploy, or do it yourself, either's fine.

## Considered, not done this round

A `report-to`/`report-uri` collection endpoint would mean CSP violations from *any*
real visitor get logged to Vercel's function logs, not just what you catch by
manually opening DevTools once. Didn't build it this checkpoint — it's a genuinely
separate small feature (a new endpoint, which per Checkpoint 5's fix needs its own
method restriction, except inverted: it needs to accept *POST*, not reject it, since
that's how browsers deliver reports) rather than a one-line addition to this one. Say
if you want it as its own checkpoint — for a single-page site with a manual
verification step already in front of you, it's a nice-to-have, not a blocker.

## Verified before packaging

- `vercel.json` parses as valid JSON.
- The header entry at `key: "Content-Security-Policy-Report-Only"` is confirmed still
  that exact key — not accidentally switched to enforced.
- `unsafe-inline` no longer appears anywhere in the file.
- All three hashes independently re-derived from the current `index.html` and
  confirmed present verbatim in the shipped policy string (catches a copy-paste
  mismatch, not just a computation mistake).
- Every directive besides `script-src`/`style-src` diffed word-for-word against the
  pre-checkpoint policy — all nine other directives are unchanged.
- `scripts/compute-csp-hashes.js` — syntax-checked, run for real, and its output
  cross-checked against three independent hash computations (Python `hashlib`,
  `openssl`, Node `crypto`) plus confirmed against what's actually in `vercel.json`.

## Not touched, as instructed

`index.html` (no content changes this round — the hashes are computed against
Checkpoint 5's version of it), the stale root-level files, `.gitignore`, rate limiting,
the API key restriction, and Search Console submission — all still Checkpoint 7 or
dashboard/account items, not re-explained here.

## What's next

**Checkpoint 7** — delete-these-files instructions + a new `.gitignore`. That's the
last item from the audit that's still pending as a discrete checkpoint.

## What's in this zip

```
vercel.json                        (updated — supersedes Checkpoint 1's copy)
scripts/compute-csp-hashes.js      (new)
CHECKPOINT_6_NOTES.md
```

`index.html` and the three `api/*.js` files from Checkpoint 5 are unchanged and still
apply — this zip doesn't repeat those files.
