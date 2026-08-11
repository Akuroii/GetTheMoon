#!/usr/bin/env node
// Recomputes the CSP hash-sources for index.html's inline <script>/<style> blocks.
//
// Run this after ANY edit to the inline JSON-LD script, the inline app-logic script,
// or the inline <style> block — a hash-based CSP is byte-exact, so changing so much as
// one character inside those blocks invalidates the matching hash. Paste the three
// printed values into vercel.json's script-src / style-src directives afterward.
// See CHECKPOINT_6_NOTES.md for why hashes were chosen over nonces here.
//
// Usage: node scripts/compute-csp-hashes.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extract(regex, label) {
  const m = html.match(regex);
  if (!m) {
    throw new Error(
      `Could not find the ${label} block — did index.html's structure change ` +
      `(e.g. a second inline <style>, or the ld+json script moved)? Update the ` +
      `regex in this script rather than guessing at a hash by hand.`
    );
  }
  return m[1];
}

function hash(content) {
  const digest = crypto.createHash('sha256').update(content, 'utf8').digest('base64');
  return `sha256-${digest}`;
}

const ld    = extract(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, 'JSON-LD');
const app   = extract(/<script>([\s\S]*?)<\/script>/, 'app-logic');
const style = extract(/<style>([\s\S]*?)<\/style>/, 'inline style');

console.log('script-src additions:');
console.log(`  '${hash(ld)}'   (JSON-LD structured-data block)`);
console.log(`  '${hash(app)}'   (app-logic block)`);
console.log();
console.log('style-src addition:');
console.log(`  '${hash(style)}'`);
