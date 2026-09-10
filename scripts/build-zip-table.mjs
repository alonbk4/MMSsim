/**
 * Collapse the us-zips dataset into a table small enough to ship.
 *
 * The app needs a location only accurately enough to place the sun: a degree
 * of latitude moves the midsummer sun by a degree, which is noise next to the
 * ±35% bands the systems themselves carry. So full five-digit resolution
 * (33,791 entries, ~6 MB) is wasted, and a flat three-digit prefix table would
 * be tiny but puts Hawaii 35° from where it belongs.
 *
 * This keeps three digits wherever that lands within 1.5° of latitude and
 * splits further only where it does not — which is Alaska, Hawaii and a
 * handful of long western prefixes. The result is ~1,400 entries and under
 * 10 KB gzipped, with a worst case of 1.5° and a median of 0.23°.
 *
 * Run with:  node scripts/build-zip-table.mjs
 * Requires:  npm i --no-save us-zips
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const zips = require('us-zips');

const TOLERANCE_DEG = 1.5;

const stat = (arr) => {
  const lat = arr.reduce((a, b) => a + b.latitude, 0) / arr.length;
  const lon = arr.reduce((a, b) => a + b.longitude, 0) / arr.length;
  const dev = Math.max(...arr.map((v) => Math.abs(v.latitude - lat)));
  return { lat, lon, dev };
};

const byPrefix = (len) => {
  const g = {};
  for (const [zip, v] of Object.entries(zips)) (g[zip.slice(0, len)] ??= []).push(v);
  return g;
};

const table = {};
for (const [p3, arr] of Object.entries(byPrefix(3))) {
  const s = stat(arr);
  if (s.dev <= TOLERANCE_DEG) { table[p3] = s; continue; }

  const sub = {};
  for (const [zip, v] of Object.entries(zips)) {
    if (zip.startsWith(p3)) (sub[zip.slice(0, 4)] ??= []).push(v);
  }
  for (const [p4, arr4] of Object.entries(sub)) {
    const s4 = stat(arr4);
    if (s4.dev <= TOLERANCE_DEG) { table[p4] = s4; continue; }
    for (const [zip, v] of Object.entries(zips)) {
      if (zip.startsWith(p4)) table[zip] = { lat: v.latitude, lon: v.longitude, dev: 0 };
    }
  }
}

const entries = Object.entries(table).sort(([a], [b]) => a.localeCompare(b));
const rows = entries
  // Keys are quoted: a bare 006 is not a valid object key in TypeScript.
  .map(([k, v]) => `  '${k}': [${v.lat.toFixed(2)}, ${v.lon.toFixed(2)}, ${v.dev.toFixed(2)}],`)
  .join('\n');

const devs = entries.map(([, v]) => v.dev).sort((a, b) => a - b);
const out = `// GENERATED FILE — do not edit by hand.
// Rebuild with: npm i --no-save us-zips && node scripts/build-zip-table.mjs
//
// Source: the \`us-zips\` package (MIT), ${Object.keys(zips).length} US ZIP centroids,
// collapsed to ${entries.length} prefixes. Each row is [latitude, longitude,
// latitude spread in degrees] — the spread is how far the widest ZIP under that
// prefix sits from the value given, so the app can say how sure it is.
//
// Worst case ${devs[devs.length - 1].toFixed(2)}°, median ${devs[Math.floor(devs.length / 2)].toFixed(2)}°.

export const ZIP_CENTROIDS: Record<string, [number, number, number]> = {
${rows}
};
`;

writeFileSync(new URL('../src/engine/data/zip-centroids.ts', import.meta.url), out);
console.log(`wrote ${entries.length} rows`);
