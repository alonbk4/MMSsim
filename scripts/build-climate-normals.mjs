/**
 * Build the offline weather table: typical monthly weather for every place the
 * bundled ZIP table can resolve, so a ZIP code sets the climate as well as the
 * sun without a network.
 *
 * Source is NASA POWER's climatology service — MERRA-2 reanalysis for the
 * meteorology, CERES satellite for the sunshine — averaged over the same
 * fifteen full years the in-app fetch uses. One request per grid cell rather
 * than per ZIP: POWER answers with the value of the cell containing the point,
 * so ZIPs that share a cell share a row.
 *
 * Two things here were settled against a real response (`--probe`), not the
 * docs:
 *
 *  - Climatology T2M_MAX / T2M_MIN are the most extreme readings of the month
 *    (Ann Arbor's July "max" is 37 °C), not mean daily highs and lows. Feeding
 *    those into Penman–Monteith overstates the vapour deficit badly. T2M_RANGE
 *    is the mean daily range (11.3 °C in July, against 10.9 from a year of
 *    daily data), so highs and lows are taken as mean ± half of it.
 *  - Custom periods are supported and fast (~1 s), so the years can match the
 *    in-app fetch exactly.
 *
 * POWER does not publish reference evapotranspiration, so it is computed here
 * with FAO-56 Penman–Monteith on monthly means (FAO-56 ch. 3–4, eqs 6, 7, 8,
 * 11–13, 21–25, 37–39, 43) — the same definition as the ERA5 record the app
 * ships for Ann Arbor, which it is checked against at the end.
 *
 * Run with:  node scripts/build-climate-normals.mjs           (writes the table)
 *            node scripts/build-climate-normals.mjs --probe   (one raw response)
 * Normally run by .github/workflows/climate-normals.yml.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'https://power.larc.nasa.gov/api/temporal/climatology/point';
const PARAMS = ['T2M', 'T2M_RANGE', 'T2MDEW', 'WS2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** FAO-56 table 2.5: the day of year that represents each month. */
const MID_DOY = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

const TO_YEAR = Number(process.env.CLIMATE_TO_YEAR) || new Date().getUTCFullYear() - 1;
const FROM_YEAR = Number(process.env.CLIMATE_FROM_YEAR) || TO_YEAR - 14;
const CONCURRENCY = 4;

/* MERRA-2's grid: 0.5° of latitude by 0.625° of longitude, centred on whole
   multiples of each from -90 / -180. */
const snapLat = (lat) => Math.round(lat / 0.5) * 0.5;
const snapLon = (lon) => Math.round((lon + 180) / 0.625) * 0.625 - 180;

const url = (lat, lon) => `${BASE}?${new URLSearchParams({
  parameters: PARAMS.join(','),
  community: 'RE',
  latitude: String(lat),
  longitude: String(lon),
  format: 'JSON',
  start: String(FROM_YEAR),
  end: String(TO_YEAR),
})}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCell(lat, lon) {
  let wait = 2000;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url(lat, lon), { signal: AbortSignal.timeout(60000) });
      if (res.ok) return await res.json();
      if (attempt >= 6 || (res.status < 500 && res.status !== 429)) {
        throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
    } catch (e) {
      if (attempt >= 6) throw e;
    }
    await sleep(wait);
    wait *= 2;
  }
}

/* ---------------- FAO-56 Penman–Monteith, monthly ---------------- */

const satVp = (t) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));

/** Extraterrestrial radiation, MJ m⁻² day⁻¹ (eqs 21–25). */
function extraterrestrial(latDeg, doy) {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  const decl = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(decl))));
  return ((24 * 60) / Math.PI) * 0.082 * dr
    * (ws * Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.sin(ws));
}

/** Monthly reference ET, mm per day. `m` indexes into the twelve-month arrays. */
export function referenceEt({ lat, elevation, t, range, dew, wind, sunKwh }, m) {
  const T = t[m];
  const tmax = T + range[m] / 2;
  const tmin = T - range[m] / 2;
  const pressure = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26;
  const gamma = 0.000665 * pressure;
  const delta = (4098 * satVp(T)) / (T + 237.3) ** 2;
  const es = (satVp(tmax) + satVp(tmin)) / 2;
  const ea = Math.min(satVp(dew[m]), es);

  const rs = sunKwh[m] * 3.6;
  const ra = extraterrestrial(lat, MID_DOY[m]);
  const rso = (0.75 + 2e-5 * elevation) * ra;
  const ratio = rso > 0 ? Math.min(1, rs / rso) : 0.5;
  const sigma = 4.903e-9;
  const rnl = sigma * (((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4) / 2)
    * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * ratio - 0.35);
  const rn = 0.77 * rs - rnl;
  // Soil heat flux from the months either side (eq 43).
  const g = 0.07 * (t[(m + 1) % 12] - t[(m + 11) % 12]);

  const et = (0.408 * delta * (rn - g) + gamma * (900 / (T + 273)) * wind[m] * (es - ea))
    / (delta + gamma * (1 + 0.34 * wind[m]));
  return Math.max(0, et);
}

/** Turn one POWER response into the twelve-number series the app reads. */
export function summarise(json, lat, lon) {
  const p = json?.properties?.parameter;
  if (!p) throw new Error('no parameter block');
  const series = (k) => MONTHS.map((mo) => {
    const v = p[k]?.[mo];
    if (typeof v !== 'number' || v <= -999) throw new Error(`missing ${k} ${mo}`);
    return v;
  });
  const elevation = Number(json.geometry?.coordinates?.[2]) || 0;
  const input = {
    lat, elevation,
    t: series('T2M'), range: series('T2M_RANGE'), dew: series('T2MDEW'),
    wind: series('WS2M'), sunKwh: series('ALLSKY_SFC_SW_DWN'),
  };
  const rain = series('PRECTOTCORR');
  return {
    lat, lon, elevation: Math.round(elevation),
    meanTempC: input.t,
    rainfallMm: rain.map((mmDay, m) => mmDay * DAYS[m]),
    etoMm: MONTHS.map((_, m) => referenceEt(input, m) * DAYS[m]),
    peakSunHours: input.sunKwh,
  };
}

/* ---------------- the cells to fetch ---------------- */

function zipCells() {
  const src = readFileSync(new URL('../src/engine/data/zip-centroids.ts', import.meta.url), 'utf8');
  const cells = new Map();
  for (const [, lat, lon] of src.matchAll(/'\d+': \[(-?[\d.]+), (-?[\d.]+), [\d.]+\]/g)) {
    const cLat = snapLat(Number(lat));
    const cLon = snapLon(Number(lon));
    cells.set(`${cLat},${cLon}`, [cLat, cLon]);
  }
  return [...cells.values()].sort((a, b) => b[0] - a[0] || a[1] - b[1]);
}

const fmt = (v) => Number(v.toFixed(3)).toString();

async function build() {
  const cells = zipCells();
  console.log(`${cells.length} grid cells for ${FROM_YEAR}–${TO_YEAR}`);
  const rows = new Array(cells.length);
  const failed = [];
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < cells.length) {
      const i = next++;
      const [lat, lon] = cells[i];
      try {
        rows[i] = summarise(await fetchCell(lat, lon), lat, lon);
      } catch (e) {
        failed.push(`${lat},${lon}: ${e.message}`);
      }
      done++;
      if (done % 100 === 0) console.log(`  ${done}/${cells.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (failed.length) console.log(`${failed.length} cells failed:\n  ${failed.join('\n  ')}`);
  const good = rows.filter(Boolean);
  if (good.length < cells.length * 0.97) {
    throw new Error(`Only ${good.length} of ${cells.length} cells came back — not writing a table with holes in it.`);
  }

  // Integer-ish encoding keeps the table small: tenths of a degree, whole
  // millimetres, hundredths of a sun hour.
  const lines = good.map((r) => [
    fmt(r.lat), fmt(r.lon), r.elevation,
    ...r.meanTempC.map((v) => Math.round(v * 10)),
    ...r.rainfallMm.map((v) => Math.round(v)),
    ...r.etoMm.map((v) => Math.round(v)),
    ...r.peakSunHours.map((v) => Math.round(v * 100)),
  ].join(' '));

  const built = new Date().toISOString().slice(0, 10);
  const out = `// GENERATED FILE — do not edit by hand.
// Rebuild with the "Build offline weather averages" workflow, or locally with
// node scripts/build-climate-normals.mjs (needs to reach power.larc.nasa.gov).
//
// NASA POWER climatology, ${FROM_YEAR}–${TO_YEAR}: MERRA-2 reanalysis for temperature,
// rain, humidity and wind; CERES satellite for sunshine. Reference ET is
// FAO-56 Penman–Monteith computed from those. ${good.length} grid cells of
// 0.5° × 0.625°, one for every cell the bundled ZIP table lands in. Built ${built}.
//
// These data were obtained from the NASA Langley Research Center (LaRC) POWER
// Project funded through the NASA Earth Science/Applied Science Program.
//
// One cell per line: latitude, longitude, elevation (m), then twelve each of
// mean temperature (tenths of °C), rain (mm), reference ET (mm) and sun
// (hundredths of kWh/m²/day, i.e. peak sun hours).

export const NORMALS_YEARS: [number, number] = [${FROM_YEAR}, ${TO_YEAR}];
export const NORMALS_BUILT = '${built}';
export const NORMALS_TABLE = \`
${lines.join('\n')}
\`;
`;
  writeFileSync(new URL('../src/engine/data/climate-normals.ts', import.meta.url), out);
  console.log(`wrote ${good.length} cells, ${(out.length / 1024).toFixed(0)} KB`);

  // The check that matters: the ERA5 record already shipped for Ann Arbor.
  const aa = good.find((r) => r.lat === snapLat(42.27) && r.lon === snapLon(-83.73));
  if (aa) {
    const sum = (xs) => xs.reduce((a, b) => a + b, 0).toFixed(0);
    console.log('Ann Arbor cell vs shipped ERA5 2010–2024 (rain 915, ET0 949 mm/yr):');
    console.log(`  rain ${sum(aa.rainfallMm)} mm, ET0 ${sum(aa.etoMm)} mm`);
    console.log(`  temp ${aa.meanTempC.map((v) => v.toFixed(1)).join(' ')}`);
    console.log(`  ET0  ${aa.etoMm.map((v) => v.toFixed(0)).join(' ')}`);
    console.log(`  sun  ${aa.peakSunHours.map((v) => v.toFixed(2)).join(' ')}`);
  }
}

async function probe() {
  const [lat, lon] = [snapLat(42.27), snapLon(-83.73)];
  const json = await fetchCell(lat, lon);
  console.log(JSON.stringify(json.header), JSON.stringify(json.geometry));
  const r = summarise(json, lat, lon);
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(14), Array.isArray(v) ? v.map((x) => x.toFixed(2)).join(' ') : v);
  console.log('annual ET0', r.etoMm.reduce((a, b) => a + b, 0).toFixed(0), 'rain', r.rainfallMm.reduce((a, b) => a + b, 0).toFixed(0));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  await (process.argv.includes('--probe') ? probe() : build());
}
