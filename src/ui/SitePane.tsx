import { useState } from 'react';
import {
  applyLatitude, applySlope, buildDrivers, CLIMATE_PRESETS, getPreset,
  runoffFraction, siteFromPreset, solarLatitude,
} from '../engine/climate';
import {
  formatCoords, isPlausibleZip, locateDevice, lookupZip, plausibleClimates,
  type ResolvedLocation,
} from '../engine/location';
import { ClimateFetchError, fetchClimate } from '../engine/climateFetch';
import { findNormals, type NormalsHit, type WeatherChoice } from '../engine/normals';
import { parseObservedClimate } from '../engine/observed';
import { sunSummary } from '../engine/solar';
import type { SiteProfile } from '../engine/types';
import { useApp } from '../state/store';
import { ClimateChart, SunHoursChart } from './charts';
import { compact, Field, Icon } from './common';
import { WebsiteCard } from './WebsiteCard';

export function SitePane() {
  const site = useApp((s) => s.design.site);
  const setSite = useApp((s) => s.setSite);
  const drivers = buildDrivers(site);
  const preset = getPreset(site.climate);

  const num = (patch: Partial<SiteProfile>) => setSite(patch);

  return (
    <div className="pane">
      <div className="pane-inner">
        <div className="card">
          <header><h2>The site</h2></header>
          <div className="stack">
            <Field label="Name">
              <input
                type="text" value={site.name}
                onChange={(e) => num({ name: e.target.value })}
              />
            </Field>
            <SiteLocation />
            <Field label="Climate">
              <select
                value={site.climate}
                onChange={(e) => {
                  const p = CLIMATE_PRESETS.find((c) => c.id === e.target.value);
                  if (p) setSite(siteFromPreset(p, site));
                }}
              >
                {/* Without this the browser shows the first preset while the
                    site is actually running on measured weather, which reads
                    as a climate the user never chose. */}
                {site.climateSource === 'observed' && (
                  <option value="custom">
                    Measured weather{site.climateYears ? ` — ${site.climateYears[0]}–${site.climateYears[1]}` : ''}
                  </option>
                )}
                {CLIMATE_PRESETS.map((p) => {
                  const likely = plausibleClimates(site.latitude).includes(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.label}{likely ? '' : '  — unusual at this latitude'}
                    </option>
                  );
                })}
              </select>
            </Field>
            {site.climateSource === 'observed' ? (
              <div className="card-note" style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px',
                background: 'var(--surface-2)',
              }}>
                <strong style={{ color: 'var(--success-text)' }}>
                  ● {site.climateLabel ?? 'Observed'}
                </strong>
                <div style={{ marginTop: 3 }}>
                  Running on measured weather for this ground rather than an archetype
                  {site.climateProvenance ? ` — ${site.climateProvenance}` : ''}.
                  {' '}{Math.round(site.annualRainfallMm)} mm of rain a year.
                </div>
                <div className="meta-line" style={{ marginTop: 5 }}>
                  Choosing a climate above replaces it with a generic one.
                </div>
              </div>
            ) : (
              <p className="card-note">{preset.blurb}</p>
            )}
            <ClimateSources />
          </div>
        </div>

        <div className="card">
          <header>
            <h2>The sun here</h2>
            <span className="sub">latitude sets the sun</span>
          </header>
          <LatitudeControl />
        </div>

        <div className="card">
          <header>
            <h2>Water in, water out</h2>
            <span className="sub">millimetres per month</span>
          </header>
          <ClimateChart rainfall={drivers.rainfallMm} eto={site.etoMm} />
          <p className="card-note" style={{ marginTop: 8 }}>
            Where the orange line sits above the bars, plants are living on stored water —
            yours or the soil's. That gap is what storage and mulch are for.
          </p>
        </div>

        <div className="card">
          <header><h2>Ground & roof</h2></header>
          <div className="stack">
            <Slider
              label="Usable yard area" value={site.lotAreaM2} min={20} max={5000} step={10}
              suffix="m²" onChange={(v) => num({ lotAreaM2: v })}
            />
            <Slider
              label="Yard width" value={site.lotWidthM} min={4} max={120} step={1}
              suffix="m" onChange={(v) => num({ lotWidthM: v })}
              hint={`${Math.round(site.lotAreaM2 / Math.max(4, site.lotWidthM))} m deep`}
            />
            <Slider
              label="Roof area" value={site.roofAreaM2} min={0} max={600} step={5}
              suffix="m²" onChange={(v) => num({ roofAreaM2: v })}
              hint="Catchment and panels compete for this"
            />
            <Slider
              label="House height" value={site.houseHeightM} min={0} max={20} step={0.5}
              suffix="m" onChange={(v) => num({ houseHeightM: v })}
              hint="It is the biggest shadow on most plots"
            />
            <Field label="Soil">
              <select value={site.soil} onChange={(e) => num({ soil: e.target.value as SiteProfile['soil'] })}>
                <option value="sand">Sand — drains fast, holds little</option>
                <option value="loam">Loam — the easy case</option>
                <option value="clay">Clay — holds water, waterlogs</option>
              </select>
            </Field>
            <Slider
              label="Annual rainfall" value={site.annualRainfallMm} min={50} max={3000} step={10}
              suffix="mm" onChange={(v) => num({ annualRainfallMm: v })}
              hint={`${compact(site.annualRainfallMm * site.roofAreaM2 * 0.85)} L/yr off the whole roof`}
            />
          </div>
        </div>

        <div className="card">
          <header>
            <h2>Which way the ground falls</h2>
            <span className="sub">slope changes sun and water</span>
          </header>
          <SlopeControl />
        </div>

        <div className="card">
          <header><h2>The household</h2></header>
          <div className="stack">
            <Slider
              label="People" value={site.household} min={1} max={12} step={1}
              suffix="" onChange={(v) => num({ household: v })}
            />
            <Slider
              label="Water use" value={site.waterUsePerPersonLPerDay} min={20} max={400} step={5}
              suffix="L/person/day" onChange={(v) => num({ waterUsePerPersonLPerDay: v })}
              hint={`${compact(site.waterUsePerPersonLPerDay * site.household * 365)} L/yr for the household`}
            />
            <Slider
              label="Electricity" value={site.electricityPerPersonKwhPerDay} min={0.5} max={20} step={0.5}
              suffix="kWh/person/day" onChange={(v) => num({ electricityPerPersonKwhPerDay: v })}
            />
            <Slider
              label="Food energy" value={site.caloriesPerPersonPerDay} min={1200} max={4000} step={50}
              suffix="kcal/person/day" onChange={(v) => num({ caloriesPerPersonPerDay: v })}
            />
            <Slider
              label="Protein" value={site.proteinPerPersonKgPerMonth} min={0.5} max={5} step={0.1}
              suffix="kg/person/month" onChange={(v) => num({ proteinPerPersonKgPerMonth: v })}
            />
            <Slider
              label="Greywater recovered" value={Math.round(site.greywaterFraction * 100)} min={0} max={90} step={5}
              suffix="% of use" onChange={(v) => num({ greywaterFraction: v / 100 })}
              hint="Shower, bath, laundry and sink — not the toilet"
            />
          </div>
        </div>

        <WebsiteCard />

        <p className="card-note">
          These presets are a starting point, not your site. Every one of them is worth
          replacing with a number you have measured — a rain gauge and a year is the
          cheapest instrument in this whole app.
        </p>
      </div>
    </div>
  );
}

/**
 * Finding the site, and with it the weather, without a network.
 *
 * Both routes work offline: the device's own fix, and a bundled table of US ZIP
 * centroids. Deliberately no geocoding service — this is meant to keep working
 * in a shed at the bottom of the garden, which is where you would actually be
 * standing when you wanted it. Once located, the site takes a saved record for
 * the same ground if there is one, else the built-in averages for that grid
 * cell (US only), else keeps the climate it had and says so.
 */
function SiteLocation() {
  const site = useApp((s) => s.design.site);
  const adoptLocation = useApp((s) => s.adoptLocation);
  const [outcome, setOutcome] = useState<WeatherChoice | null>(null);

  const adopt = async (loc: ResolvedLocation) => {
    let normals: NormalsHit | null = null;
    try {
      normals = await findNormals(loc.latitude, loc.longitude);
    } catch {
      // The table is a separate chunk; offline before it was ever cached, it
      // is simply not there, and the location still counts.
    }
    setOutcome(adoptLocation(loc, normals));
  };

  return (
    <Field label="Where">
      <LocationFinder onFound={adopt} />
      {site.locationLabel && (
        <p className="meta-line">
          Set from {site.locationLabel}
          {site.locationSource === 'zip' && site.locationAccuracyDeg !== undefined
            && ` — good to about ${site.locationAccuracyDeg.toFixed(1)}° of latitude`}
          {site.locationSource === 'device' && ' — reported by this device'}
          {site.longitude !== undefined && ` · ${formatCoords(site.latitude, site.longitude)}`}
        </p>
      )}
      {outcome && <WeatherOutcome outcome={outcome} />}
    </Field>
  );
}

function WeatherOutcome({ outcome }: { outcome: WeatherChoice }) {
  if (outcome.kind === 'saved') {
    return (
      <p className="meta-line" style={{ color: 'var(--success-text)' }}>
        Weather: your saved record for {outcome.record.name}
        {outcome.km >= 1 ? `, ${outcome.km.toFixed(0)} km away` : ''} — measured beats typical.
      </p>
    );
  }
  if (outcome.kind === 'normals') {
    const { climate, gridOffsetKm } = outcome.hit;
    return (
      <p className="meta-line" style={{ color: 'var(--success-text)' }}>
        Weather: built-in averages for {climate.years[0]}–{climate.years[1]}, from a grid
        cell {gridOffsetKm < 1 ? 'right here' : `${gridOffsetKm.toFixed(0)} km away`}. No network
        needed. Fetching below gets fifteen years on a finer grid.
      </p>
    );
  }
  return (
    <p className="meta-line">
      No built-in weather this far from a US ZIP, so the climate below is unchanged —
      pick the closest one, or fetch measured weather for this point.
    </p>
  );
}

/**
 * Where the weather comes from: fetch it for the current coordinates, switch
 * between records already kept, or paste one in from the offline tool.
 */
function ClimateSources() {
  const design = useApp((s) => s.design);
  const site = design.site;
  const saveClimate = useApp((s) => s.saveClimate);
  const useClimateRecord = useApp((s) => s.useClimate);
  const removeClimate = useApp((s) => s.removeClimate);

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label = site.locationLabel
    ?? (site.longitude !== undefined ? formatCoords(site.latitude, site.longitude) : null);

  const fetchHere = async () => {
    if (site.longitude === undefined) {
      setError('Set a location first — a ZIP code, or Use my location below.');
      return;
    }
    setBusy(true); setError(null); setNote(null);
    try {
      const { climate, gridOffsetKm } = await fetchClimate(site.latitude, site.longitude);
      saveClimate(climate, label ?? formatCoords(site.latitude, site.longitude));
      setNote(
        `Loaded ${climate.years[0]}–${climate.years[1]}. `
        + `The nearest grid cell is ${gridOffsetKm < 1 ? 'under a kilometre' : `${gridOffsetKm.toFixed(0)} km`} `
        + 'from the point you gave, which is the resolution of the weather, not of your yard.',
      );
    } catch (e) {
      setError(e instanceof ClimateFetchError ? e.message
        : 'Something went wrong fetching the weather.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row wrap" style={{ gap: 8 }}>
        <button className="btn small" onClick={fetchHere} disabled={busy}>
          {busy ? 'Fetching 15 years…' : `Fetch measured weather for ${label ?? 'this location'}`}
        </button>
        <ClimateImport />
      </div>

      {note && <p className="meta-line" style={{ color: 'var(--success-text)' }}>{note}</p>}
      {error && <p className="meta-line" style={{ color: 'var(--status-critical)' }}>{error}</p>}

      {design.climates.length > 0 && (
        <div className="stack" style={{ gap: 5 }}>
          <span className="meta-line">Saved locations</span>
          {design.climates.map((c) => {
            const active = site.climateSource === 'observed'
              && Math.abs(site.latitude - c.latitude) < 0.001
              && Math.abs((site.longitude ?? 999) - c.longitude) < 0.001;
            return (
              <div key={c.id} className="row" style={{ gap: 8 }}>
                <button
                  className="chip" aria-pressed={active} style={{ flex: '1 1 auto', textAlign: 'left' }}
                  onClick={() => useClimateRecord(c.id)}
                >
                  {c.name}
                  <span style={{ opacity: 0.7 }}>
                    {' · '}{Math.round(c.rainfallMm.reduce((a, b) => a + b, 0))} mm
                    {' · '}{c.years[0]}–{c.years[1]}
                  </span>
                </button>
                {design.climates.length > 1 && (
                  <button
                    className="btn small danger" aria-label={`Remove ${c.name}`}
                    onClick={() => removeClimate(c.id)}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClimateImport() {
  const saveClimate = useApp((s) => s.saveClimate);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const parsed = parseObservedClimate(text);
    if ('error' in parsed) { setError(parsed.error); return; }
    saveClimate(parsed, formatCoords(parsed.latitude, parsed.longitude));
    setError(null);
    setText('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="btn small" onClick={() => setOpen(true)}>
        Paste from the offline tool
      </button>
    );
  }

  return (
    <div className="stack" style={{ gap: 8, flexBasis: '100%' }}>
      <p className="card-note" style={{ marginBottom: 0 }}>
        Open <code>tools/climate-fetch.html</code> from the repository in a browser,
        enter your coordinates, and paste what it produces here. Fifteen years of
        reanalysis, averaged into the twelve numbers this model reads.
      </p>
      <textarea
        rows={5}
        placeholder='{ "mmssimClimate": 1, … }'
        value={text}
        onChange={(e) => { setText(e.target.value); setError(null); }}
      />
      {error && <p className="meta-line" style={{ color: 'var(--status-critical)' }}>{error}</p>}
      <div className="row" style={{ gap: 8 }}>
        <button className="btn small primary" onClick={load} disabled={!text.trim()}>
          Use this weather
        </button>
        <button className="btn small" onClick={() => { setOpen(false); setError(null); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function LocationFinder({ onFound }: { onFound: (loc: ResolvedLocation) => void }) {
  const [zip, setZip] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useDevice = async () => {
    setBusy(true);
    setError(null);
    try {
      onFound(await locateDevice());
      setZip('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get a position.');
    } finally {
      setBusy(false);
    }
  };

  const useZip = () => {
    const hit = lookupZip(zip);
    if (!hit) {
      setError('No match for that ZIP. Check the digits, or set the latitude by hand below.');
      return;
    }
    setError(null);
    onFound(hit);
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row wrap" style={{ gap: 8 }}>
        <button className="btn" onClick={useDevice} disabled={busy}>
          {busy ? 'Locating…' : 'Use my location'}
        </button>
        <span className="row" style={{ gap: 6, flex: '1 1 190px' }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="US ZIP code"
            value={zip}
            onChange={(e) => { setZip(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') useZip(); }}
            aria-label="US ZIP code"
          />
          <button className="btn" onClick={useZip} disabled={!isPlausibleZip(zip)}>
            Find
          </button>
        </span>
      </div>
      {error && (
        <p className="meta-line" style={{ color: 'var(--status-critical)' }}>{error}</p>
      )}
      <p className="meta-line">
        Places the sun, and in the US sets typical weather from a built-in table —
        no network needed. Elsewhere, pick the closest climate below or fetch.
      </p>
    </div>
  );
}

function SlopeControl() {
  const site = useApp((s) => s.design.site);
  const setSite = useApp((s) => s.setSite);
  const effective = solarLatitude(site);
  const runoff = runoffFraction(site);
  const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][
    Math.round(site.slopeAspect / 45) % 8
  ];
  const shift = effective - site.latitude;

  return (
    <div className="stack">
      <Field label="Steepness" value={`${site.slopePercent}%`}>
        <input
          type="range" min={0} max={45} step={1} value={site.slopePercent}
          onChange={(e) => setSite(applySlope(site, Number(e.target.value), site.slopeAspect))}
        />
        <span className="meta-line">
          {site.slopePercent === 0
            ? 'Flat.'
            : `Falls ${site.slopePercent} m over every 100 m — about ${Math.round(Math.atan(site.slopePercent / 100) * 180 / Math.PI)}°.`}
        </span>
      </Field>

      <Field label="Falls towards" value={`${compass} · ${Math.round(site.slopeAspect)}°`}>
        <input
          type="range" min={0} max={355} step={5} value={site.slopeAspect}
          onChange={(e) => setSite(applySlope(site, site.slopePercent, Number(e.target.value)))}
        />
        <span className="meta-line">Downhill direction, clockwise from north.</span>
      </Field>

      <div className="tiles">
        <div className="tile">
          <div className="label">Sun behaves like</div>
          <div className="figure">{Math.abs(effective).toFixed(1)}°</div>
          <div className="range">
            {Math.abs(shift) < 0.1
              ? 'same as flat ground'
              : `${Math.abs(shift).toFixed(1)}° ${shift * (site.latitude >= 0 ? 1 : -1) < 0 ? 'nearer' : 'further from'} the equator`}
          </div>
        </div>
        <div className="tile">
          <div className="label">Rain that runs off</div>
          <div className="figure">{Math.round(runoff * 100)}%</div>
          <div className="range">the rest soaks in where it lands</div>
        </div>
      </div>

      <p className="card-note" style={{ marginBottom: 0 }}>
        A slope leaning towards the equator gathers light as though it were that
        much closer to it, and one leaning away loses the same. Steepness also
        decides how much rain leaves before it can soak in, which raises
        irrigation demand and is exactly what a swale is built to catch — so the
        same swale is worth far more here on steep clay than on flat sand.
      </p>
    </div>
  );
}

function LatitudeControl() {
  const site = useApp((s) => s.design.site);
  const setSite = useApp((s) => s.setSite);
  const sun = sunSummary(site.latitude);
  const hemisphere = site.latitude < 0 ? 'S' : 'N';

  const move = (lat: number) =>
    setSite({
      ...applyLatitude(site, lat),
      locationSource: 'manual',
      locationLabel: undefined,
      locationAccuracyDeg: undefined,
    });

  return (
    <div className="stack">
      <Field
        label="Latitude"
        value={`${Math.abs(site.latitude).toFixed(1)}° ${hemisphere}`}
      >
        <input
          type="range" min={-66} max={66} step={0.5}
          value={site.latitude}
          onChange={(e) => move(Number(e.target.value))}
        />
        <div className="row" style={{ gap: 8 }}>
          <input
            type="number" min={-66} max={66} step={0.1}
            value={Number(site.latitude.toFixed(1))}
            onChange={(e) => move(Number(e.target.value))}
            style={{ maxWidth: 110 }}
          />
          <span className="meta-line">
            negative is south of the equator
          </span>
        </div>
      </Field>

      <div className="tiles">
        <div className="tile">
          <div className="label">Midsummer sun</div>
          <div className="figure">{Math.round(sun.summerNoon)}°</div>
          <div className="range">{sun.summerDayLength.toFixed(1)} h of daylight</div>
        </div>
        <div className="tile">
          <div className="label">Midwinter sun</div>
          <div className="figure">{Math.round(Math.max(0, sun.winterNoon))}°</div>
          <div className="range">
            {sun.winterNoon <= 0
              ? 'sun stays below the horizon'
              : `${sun.winterDayLength.toFixed(1)} h of daylight`}
          </div>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 550 }}>
          Usable sun, hours per day
        </label>
        <SunHoursChart hours={site.peakSunHours} />
      </div>

      <p className="card-note" style={{ marginBottom: 0 }}>
        The weather says how cloudy a place is; latitude says how much sun there
        is to be blocked, how high it climbs and how long the day runs. Move this
        and the sun figures — and everything that depends on them, panels
        included — recompute from geometry. It is a what-if: the ZIP or location
        above is what sets where you are. Crossing the equator flips the seasons.
      </p>
    </div>
  );
}

function Slider({
  label, value, min, max, step, suffix, hint, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  suffix: string; hint?: string; onChange: (v: number) => void;
}) {
  return (
    <Field label={label} value={`${value % 1 === 0 ? value : value.toFixed(1)} ${suffix}`.trim()}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="meta-line">{hint}</span>}
    </Field>
  );
}
