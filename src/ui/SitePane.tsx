import { buildDrivers, CLIMATE_PRESETS, getPreset, siteFromPreset } from '../engine/climate';
import type { SiteProfile } from '../engine/types';
import { useApp } from '../state/store';
import { ClimateChart } from './charts';
import { compact, Field } from './common';

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
            <Field label="Climate">
              <select
                value={site.climate}
                onChange={(e) => {
                  const p = CLIMATE_PRESETS.find((c) => c.id === e.target.value);
                  if (p) setSite(siteFromPreset(p, site));
                }}
              >
                {CLIMATE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </Field>
            <p className="card-note">{preset.blurb}</p>
          </div>
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

        <p className="card-note">
          These presets are a starting point, not your site. Every one of them is worth
          replacing with a number you have measured — a rain gauge and a year is the
          cheapest instrument in this whole app.
        </p>
      </div>
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
