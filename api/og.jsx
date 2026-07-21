export const config = { runtime: 'edge' };

import { ImageResponse } from '@vercel/og';

const GOAL = 100000;
const MILESTONES = [1000, 5000, 10000, 25000, 50000, 75000, 100000];

// Fixed star field so the render is deterministic (same output on retries,
// not tied to Math.random() timing).
const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  r: 1 + (i % 3),
  o: 0.25 + ((i * 13) % 40) / 100
}));

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
      avatar = json.items[0].snippet.thumbnails.medium.url;
    }
  } catch (e) {
    // Fall through to the fallback card below — never throw a 500 for a social preview.
  }

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
            fontSize: 48, fontFamily: 'sans-serif'
          }}
        >
          getthemoon · the subscriber watch
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const fillPct = Math.min(subs / GOAL, 1);
  let start = 0, end = GOAL;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (subs < MILESTONES[i]) { end = MILESTONES[i]; start = i === 0 ? 0 : MILESTONES[i - 1]; break; }
    start = MILESTONES[i]; end = GOAL;
  }
  const segPct = Math.max(0, Math.min(1, (subs - start) / (end - start)));

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          width: '100%', height: '100%',
          background: '#04040a',
          position: 'relative',
          fontFamily: 'sans-serif'
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
            position: 'relative',
            boxShadow: `0 0 ${40 + fillPct * 60}px ${10 + fillPct * 20}px rgba(124,111,238,${0.25 + fillPct * 0.35})`
          }}>
            <img
              src={avatar}
              width={200}
              height={200}
              style={{ borderRadius: '50%', border: '2px solid rgba(240,238,252,0.15)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{
              fontSize: 22, letterSpacing: 4, textTransform: 'uppercase',
              color: '#9d98c2', display: 'flex', marginBottom: 8
            }}>
              GETTHEMOON · THE SUBSCRIBER WATCH
            </div>
            <div style={{ fontSize: 92, fontWeight: 600, color: '#f0eefc', display: 'flex' }}>
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
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}
