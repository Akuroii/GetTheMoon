export const config = { runtime: 'edge' };

import { ImageResponse } from '@vercel/og';

const GOAL = 100000;
const MILESTONES = [1000, 5000, 10000, 25000, 50000, 75000, 100000];

// Google Fonts static .woff2 files for the exact weights used on the site.
// Fetched at request time (edge runtime has no filesystem) and cached by
// the edge network's own HTTP cache, not re-downloaded on every request.
// NOTE: gstatic URLs are versioned/hashed and can rotate. The Space Grotesk
// URL below was verified live against fonts.googleapis.com at the time this
// was written; the Spectral italic URL is Google's typical v14 static path
// but was NOT independently confirmed reachable — verify with `curl -I` on
// both URLs after deploy. Either one failing degrades safely to the system
// sans (see loadFonts below), it will not break the endpoint.
const FONT_SOURCES = [
  {
    name: 'Space Grotesk',
    weight: 600,
    url: 'https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7oUUsj.ttf'
  },
  {
    name: 'Spectral',
    weight: 400,
    style: 'italic',
    url: 'https://fonts.gstatic.com/s/spectral/v14/rnCr-xNNww_2s0amA9uCoBW_TnnFVXQ.woff2'
  }
];

// Fixed star field so the render is deterministic (same output on retries,
// not tied to Math.random() timing).
const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  r: 1 + (i % 3),
  o: 0.25 + ((i * 13) % 40) / 100
}));

async function loadFonts() {
  // Each font loads independently — one bad/rotated URL degrades that one
  // font to the system sans instead of killing custom fonts entirely.
  const results = await Promise.allSettled(
    FONT_SOURCES.map(async (f) => {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error('font fetch failed: ' + f.name);
      const data = await res.arrayBuffer();
      return { name: f.name, data, weight: f.weight, style: f.style || 'normal' };
    })
  );
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

export default async function handler(req) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.CHANNEL_ID || 'UCLtCWRYhYmMof8kw7Ib1oqA';

  let subs = null;
  let avatar = null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`;
    const r = await fetch(url);
    const json = await r.json();
    if (json.items && json.items.length) {
      subs = parseInt(json.items[0].statistics.subscriberCount, 10);
      // Optional chaining: some channels/API responses omit the medium
      // thumbnail. Missing avatar should never break the whole card.
      avatar = json.items[0]?.snippet?.thumbnails?.medium?.url || null;
    }
  } catch (e) {
    // Fall through to the fallback card below — never throw a 500 for a social preview.
  }

  const fonts = await loadFonts();
  const headingFont = fonts.some(f => f.name === 'Space Grotesk') ? 'Space Grotesk' : 'sans-serif';
  const bodyFont = fonts.some(f => f.name === 'Spectral') ? 'Spectral' : 'sans-serif';

  // If YouTube fails, still return a branded (non-broken) card instead of erroring,
  // so link unfurls never show a missing image.
  if (subs === null) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex', width: '100%', height: '100%',
            background: '#04040a', color: '#f0eefc',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 44, fontFamily: headingFont, letterSpacing: 2
          }}
        >
          getthemoon · the subscriber watch
        </div>
      ),
      { width: 1200, height: 630, fonts }
    );
  }

  const fillPct = Math.min(subs / GOAL, 1);
  let start = 0, end = GOAL;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (subs < MILESTONES[i]) { end = MILESTONES[i]; start = i === 0 ? 0 : MILESTONES[i - 1]; break; }
    start = MILESTONES[i]; end = GOAL;
  }
  // Guard: once subs reaches the final milestone, start === end and the
  // ratio below would be a NaN division by zero. Treat that as "segment complete".
  const segPct = start === end ? 1 : Math.max(0, Math.min(1, (subs - start) / (end - start)));

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          width: '100%', height: '100%',
          background: '#04040a',
          position: 'relative',
          fontFamily: bodyFont
        }}
      >
        {/* nebula glow, matches the site's #nebula gradients */}
        <div style={{
          position: 'absolute', width: 700, height: 700, top: -260, left: -180,
          borderRadius: '50%', display: 'flex',
          background: 'radial-gradient(circle, rgba(107,79,255,0.35), transparent 70%)'
        }} />
        <div style={{
          position: 'absolute', width: 600, height: 600, bottom: -220, right: -140,
          borderRadius: '50%', display: 'flex',
          background: 'radial-gradient(circle, rgba(255,94,168,0.28), transparent 70%)'
        }} />

        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', display: 'flex',
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.r, height: s.r, borderRadius: '50%',
            background: `rgba(240,238,252,${s.o})`
          }} />
        ))}

        {/* content row */}
        <div style={{
          display: 'flex', flex: 1, alignItems: 'center',
          padding: '0 80px', gap: 56
        }}>
          <div style={{
            display: 'flex', width: 200, height: 200, borderRadius: '50%',
            position: 'relative', alignItems: 'center', justifyContent: 'center',
            background: '#14142b',
            boxShadow: `0 0 ${40 + fillPct * 60}px ${10 + fillPct * 20}px rgba(124,111,238,${0.25 + fillPct * 0.35})`
          }}>
            {avatar && (
              <img
                src={avatar}
                width={200}
                height={200}
                style={{ borderRadius: '50%', border: '2px solid rgba(240,238,252,0.15)' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{
              fontSize: 22, letterSpacing: 4, textTransform: 'uppercase',
              color: '#9d98c2', display: 'flex', marginBottom: 8, fontFamily: headingFont
            }}>
              GETTHEMOON · THE SUBSCRIBER WATCH
            </div>
            <div style={{ fontSize: 92, fontWeight: 600, color: '#f0eefc', display: 'flex', fontFamily: headingFont }}>
              {subs.toLocaleString()}
            </div>
            <div style={{ fontSize: 24, color: '#9d98c2', display: 'flex', marginBottom: 28 }}>
              subscribers · next stop {end.toLocaleString()}
            </div>

            <div style={{
              display: 'flex', width: '100%', height: 12, borderRadius: 999,
              background: '#14142b', border: '1px solid rgba(240,238,252,0.1)', position: 'relative'
            }}>
              <div style={{
                display: 'flex', width: `${segPct * 100}%`, height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg, #7c6fee, #f5c453)'
              }} />
            </div>
            <div style={{ display: 'flex', fontSize: 18, color: '#f5c453', marginTop: 10 }}>
              {(segPct * 100).toFixed(1)}% to {end.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}
