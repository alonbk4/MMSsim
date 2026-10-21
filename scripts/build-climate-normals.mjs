/**
 * Probe stage — prints what NASA POWER actually returns for one point, so the
 * build that follows is written against a real response rather than the docs.
 *
 * Run with:  node scripts/build-climate-normals.mjs --probe
 */
const BASE = 'https://power.larc.nasa.gov/api/temporal';
const PARAMS = 'T2M,T2M_MAX,T2M_MIN,T2M_RANGE,T2MDEW,RH2M,WS2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN';
const AT = { latitude: 42.27, longitude: -83.73 };

async function get(url) {
  const t0 = Date.now();
  const res = await fetch(url);
  const text = await res.text();
  console.log(`\n=== ${res.status} in ${Date.now() - t0} ms — ${url}`);
  return text;
}

const q = (extra) => `parameters=${PARAMS}&community=RE&longitude=${AT.longitude}&latitude=${AT.latitude}&format=JSON${extra}`;

for (const extra of ['', '&start=2011&end=2025', '&start=2010&end=2024']) {
  const text = await get(`${BASE}/climatology/point?${q(extra)}`);
  try {
    const j = JSON.parse(text);
    console.log('geometry', JSON.stringify(j.geometry));
    console.log('header', JSON.stringify(j.header));
    console.log('units', JSON.stringify(Object.fromEntries(Object.entries(j.parameters ?? {}).map(([k, v]) => [k, v.units]))));
    console.log('messages', JSON.stringify(j.messages));
    for (const [k, v] of Object.entries(j.properties?.parameter ?? {})) console.log(k.padEnd(18), JSON.stringify(v));
  } catch { console.log(text.slice(0, 1500)); }
}

// A year of daily values, to settle what the climatology T2M_MAX means.
const text = await get(`${BASE}/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=RE&longitude=${AT.longitude}&latitude=${AT.latitude}&format=JSON&start=20200101&end=20201231`);
try {
  const j = JSON.parse(text);
  const p = j.properties.parameter;
  const months = Array.from({ length: 12 }, () => ({ n: 0, t: 0, tx: 0, tn: 0, txMax: -99, pr: 0, sw: 0 }));
  for (const day of Object.keys(p.T2M)) {
    const m = months[Number(day.slice(4, 6)) - 1];
    m.n++; m.t += p.T2M[day]; m.tx += p.T2M_MAX[day]; m.tn += p.T2M_MIN[day];
    m.txMax = Math.max(m.txMax, p.T2M_MAX[day]); m.pr += p.PRECTOTCORR[day]; m.sw += p.ALLSKY_SFC_SW_DWN[day];
  }
  console.log('2020 daily → month: meanT, mean daily max, mean daily min, abs max, rain mm, sun');
  months.forEach((m, i) => console.log(i + 1, (m.t / m.n).toFixed(1), (m.tx / m.n).toFixed(1), (m.tn / m.n).toFixed(1), m.txMax.toFixed(1), m.pr.toFixed(0), (m.sw / m.n).toFixed(2)));
} catch { console.log(text.slice(0, 1500)); }
