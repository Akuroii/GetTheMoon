import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const errors = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost/',
  pretendToBeVisual: true,
  beforeParse(window) {
    // Stub canvas context so the unrelated starfield/dust canvases don't
    // throw in jsdom (no canvas backend installed) and mask real errors.
    window.HTMLCanvasElement.prototype.getContext = () => ({
      clearRect(){}, beginPath(){}, arc(){}, fill(){}, stroke(){}, moveTo(){}, lineTo(){},
      createLinearGradient(){ return { addColorStop(){} }; },
      set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}
    });
    // Force every fetch('/api/...') to reject, so DATA_MODE:'auto' takes
    // its mock-fallback path — this is exactly the path that used to leave
    // the page stuck, and the one most worth verifying doesn't throw.
    window.fetch = () => Promise.reject(new Error('no api in test env'));
    // jsdom doesn't implement matchMedia; stub it so the
    // prefers-reduced-motion check near the bottom of the script doesn't
    // throw and abort the rest of script execution.
    window.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} });
    window.addEventListener('error', (e) => {
      errors.push(e.error ? (e.error.stack || String(e.error)) : e.message);
    });
  }
});

await new Promise(resolve => dom.window.addEventListener('load', resolve));
// Let the async fetchStats/fetchVideos + their mock-fallback + setTimeout
// (380ms resync) settle.
await new Promise(resolve => setTimeout(resolve, 900));

const { document } = dom.window;

function check(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + ' — ' + label);
  if (!cond) errors.push('CHECK FAILED: ' + label);
}

check('subscriber count populated from mock fallback', document.getElementById('countNum').textContent.trim().length > 0 && document.getElementById('countNum').textContent !== '🌑');
check('milestone progress bar width set', document.getElementById('mjFill').style.width !== '' && document.getElementById('mjFill').style.width !== '0%');
check('mjStart/mjEnd populated', document.getElementById('mjStart').textContent !== '—' && document.getElementById('mjEnd').textContent !== '—');
check('orbit asteroids rendered', document.querySelectorAll('.mj-asteroid').length > 0);
check('custom scrollbar element exists', !!document.getElementById('mjScrollbar'));
check('recent carousel populated', document.getElementById('carouselRecent').querySelectorAll('.vcard').length > 0);
check('popular carousel populated', document.getElementById('carouselPopular').querySelectorAll('.vcard').length > 0);

// Exercise mode switches (journey/12mo/6mo/all) — this re-triggers
// renderMJOrbit + syncMjScrollbar repeatedly.
['mjMode12', 'mjMode6', 'mjModeAll', 'mjModeJourney'].forEach(id => {
  document.getElementById(id).dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});

// Exercise expand/collapse toggle.
document.getElementById('mjExpand').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
document.getElementById('mjExpand').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

// Exercise language toggle (also re-renders MJ progress + orbit under RTL).
document.getElementById('langToggle').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
check('lang switched to ar', document.getElementById('htmlRoot').getAttribute('lang') === 'ar');
document.getElementById('langToggle').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

// Exercise keyboard interaction on the new custom scrollbar.
const sb = document.getElementById('mjScrollbar');
['ArrowRight', 'ArrowLeft', 'Home', 'End'].forEach(key => {
  sb.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
});

await new Promise(resolve => setTimeout(resolve, 500));

console.log('\n--- window errors ---');
if (errors.length) {
  errors.forEach(e => console.log(e));
  console.log(`\n${errors.length} ISSUE(S) FOUND`);
  dom.window.close();
  process.exit(1);
} else {
  console.log('none — 0 issues found');
  dom.window.close();
  process.exit(0);
}
