import { useMemo, useState } from 'react';
import { CATALOG } from '../engine/catalog';
import { EVIDENCE, EVIDENCE_ORDER, RESOURCES } from '../engine/resources';
import type { EvidenceTier, SystemCategory } from '../engine/types';
import { FEATURE_DEFAULTS, systemById, useApp, useSimulation } from '../state/store';
import type { FeatureKind, ZoneKind } from '../engine/types';
import { FEATURE_LABEL, ZONE_BLURB, ZONE_LABEL } from './plan/site';
import {
  CATEGORY_ICON, CATEGORY_LABEL, compact, EvidenceBadge, Field, Icon, money, pct,
} from './common';
import { trimNum, YardCanvas } from './YardCanvas';

const CATEGORIES: SystemCategory[] = ['water', 'food', 'energy', 'sanitation', 'soil', 'shelter'];

export function DesignPane() {
  const selected = useApp((s) => s.selectedPlacementId);
  const selectedFeature = useApp((s) => s.selectedFeatureId);
  const selectedZone = useApp((s) => s.selectedZoneId);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const anySelected = selected || selectedFeature || selectedZone;

  return (
    <div className="pane no-scroll" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <YardCanvas />

      {!anySelected && !paletteOpen && (
        <button
          className="btn primary"
          style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 16, display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow)' }}
          onClick={() => setPaletteOpen(true)}
        >
          <Icon name="plus" size={16} /> Add a system
        </button>
      )}

      {paletteOpen && <PaletteSheet onClose={() => setPaletteOpen(false)} />}
      {selected && <Inspector />}
      {selectedFeature && <FeatureInspector />}
      {selectedZone && <ZoneInspector />}
    </div>
  );
}

/* ------------------------------ palette ------------------------------ */

type PaletteTab = 'systems' | 'onSite' | 'ground';

function PaletteSheet({ onClose }: { onClose: () => void }) {
  const design = useApp((s) => s.design);
  const addPlacement = useApp((s) => s.addPlacement);
  const addFeature = useApp((s) => s.addFeature);
  const addZone = useApp((s) => s.addZone);
  const [tab, setTab] = useState<PaletteTab>('systems');
  const [category, setCategory] = useState<SystemCategory | 'all'>('all');
  const [tiers, setTiers] = useState<Set<EvidenceTier>>(new Set(EVIDENCE_ORDER));

  const systems = useMemo(() => {
    const all = [...CATALOG, ...design.customSystems]
      .map((s) => systemById(design, s.id)!)
      .filter(Boolean);
    return all
      .filter((s) => category === 'all' || s.category === category)
      .filter((s) => tiers.has(s.evidence))
      .sort((a, b) =>
        EVIDENCE_ORDER.indexOf(a.evidence) - EVIDENCE_ORDER.indexOf(b.evidence)
        || a.name.localeCompare(b.name));
  }, [design, category, tiers]);

  const toggleTier = (t: EvidenceTier) => {
    const next = new Set(tiers);
    if (next.has(t) && next.size > 1) next.delete(t);
    else next.add(t);
    setTiers(next);
  };

  return (
    <div className="sheet">
      <div className="grabber" />
      <header>
        <h2>Add to the yard</h2>
        <span className="grow" />
        <button className="btn small" onClick={onClose} aria-label="Close"><Icon name="close" size={14} /></button>
      </header>
      <div className="sheet-body stack">
        <div className="row wrap">
          <button className="chip" aria-pressed={tab === 'systems'} onClick={() => setTab('systems')}>
            Systems
          </button>
          <button className="chip" aria-pressed={tab === 'onSite'} onClick={() => setTab('onSite')}>
            Already there
          </button>
          <button className="chip" aria-pressed={tab === 'ground'} onClick={() => setTab('ground')}>
            Ground
          </button>
        </div>

        {tab === 'onSite' && (
          <>
            <p className="card-note">
              Whatever is already on the site and in the way of your sun — your own
              shed, the neighbour's wall, the tree you are keeping. They produce
              nothing, but they cast real shadows, and the results change once
              they are on the plan.
            </p>
            {(Object.keys(FEATURE_LABEL) as FeatureKind[]).map((kind) => (
              <button
                key={kind} className="sys-row"
                onClick={() => { addFeature(kind); onClose(); }}
              >
                <span className="icon"><Icon name="shelter" size={17} /></span>
                <span className="grow">
                  <span className="name">{FEATURE_LABEL[kind]}</span>
                  <span className="meta-line">
                    {FEATURE_DEFAULTS[kind].w} × {FEATURE_DEFAULTS[kind].d} m ·{' '}
                    {FEATURE_DEFAULTS[kind].heightM > 0
                      ? `${FEATURE_DEFAULTS[kind].heightM} m tall`
                      : 'no height'}
                  </span>
                </span>
              </button>
            ))}
          </>
        )}

        {tab === 'ground' && (
          <>
            <p className="card-note">
              Mark ground that behaves differently. These raise warnings on bad
              placements rather than silently docking your yield — the model
              tells you and leaves the call to you.
            </p>
            {(Object.keys(ZONE_LABEL) as ZoneKind[]).map((kind) => (
              <button
                key={kind} className="sys-row"
                onClick={() => { addZone(kind); onClose(); }}
              >
                <span className="icon"><Icon name="soil" size={17} /></span>
                <span className="grow">
                  <span className="name">{ZONE_LABEL[kind]}</span>
                  <span className="desc">{ZONE_BLURB[kind]}</span>
                </span>
              </button>
            ))}
          </>
        )}

        {tab === 'systems' && <>
        <div className="row wrap">
          <button className="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="row wrap">
          {EVIDENCE_ORDER.map((t) => (
            <button key={t} className="chip" aria-pressed={tiers.has(t)} onClick={() => toggleTier(t)}>
              {EVIDENCE[t].label}
            </button>
          ))}
        </div>

        {systems.map((s) => (
          <button
            key={s.id}
            className="sys-row"
            onClick={() => { addPlacement(s.id); onClose(); }}
          >
            <span className="icon"><Icon name={CATEGORY_ICON[s.category]} size={17} /></span>
            <span className="grow">
              <span className="row" style={{ gap: 6 }}>
                <span className="name grow">{s.name}</span>
                <EvidenceBadge tier={s.evidence} />
              </span>
              <span className="desc">{s.summary}</span>
              <span className="meta-line">
                {trimNum(s.unitDefault)} {s.unitLabel} · {money(s.capitalPerUnit * s.unitDefault)} to build
              </span>
            </span>
          </button>
        ))}
        {systems.length === 0 && <p className="card-note">Nothing matches those filters.</p>}
        </>}
      </div>
    </div>
  );
}

/* ------------------------------ site features ------------------------------ */

function FeatureInspector() {
  const design = useApp((s) => s.design);
  const id = useApp((s) => s.selectedFeatureId)!;
  const update = useApp((s) => s.updateFeature);
  const remove = useApp((s) => s.removeFeature);
  const selectFeature = useApp((s) => s.selectFeature);
  const setShadows = useApp((s) => s.setShadows);
  const sim = useSimulation();

  const f = design.features.find((x) => x.id === id);
  if (!f) return null;

  // Who is standing in this thing's shadow?
  const victims = sim.expected.placements
    .filter((p) => p.shadedBy?.label === (f.label || f.kind))
    .sort((a, b) => a.sunExposure - b.sunExposure);

  return (
    <div className="sheet">
      <div className="grabber" />
      <header>
        <h2>{f.label || FEATURE_LABEL[f.kind]}</h2>
        <span className="grow" />
        <button className="btn small" onClick={() => selectFeature(null)} aria-label="Close">
          <Icon name="close" size={14} />
        </button>
      </header>
      <div className="sheet-body stack">
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="chip">{FEATURE_LABEL[f.kind]}</span>
          <span className="chip">Already on site</span>
        </div>

        <Field label="Name">
          <input
            type="text" value={f.label ?? ''} placeholder={FEATURE_LABEL[f.kind]}
            onChange={(e) => update(id, { label: e.target.value })}
          />
        </Field>

        <Field label="Height" value={`${trimNum(f.heightM)} m`}>
          <input
            type="range" min={0} max={25} step={0.25} value={f.heightM}
            onChange={(e) => update(id, { heightM: Number(e.target.value) })}
          />
          <span className="meta-line">
            Height is the whole story for shade — a shadow is this, divided by the
            tangent of the sun's angle.
          </span>
        </Field>

        <div className="row" style={{ gap: 10 }}>
          <Field label="Width" value={`${trimNum(f.w)} m`}>
            <input
              type="range" min={0.2} max={40} step={0.2} value={f.w}
              onChange={(e) => update(id, { w: Number(e.target.value) })}
            />
          </Field>
          <Field label="Depth" value={`${trimNum(f.d)} m`}>
            <input
              type="range" min={0.2} max={40} step={0.2} value={f.d}
              onChange={(e) => update(id, { d: Number(e.target.value) })}
            />
          </Field>
        </div>

        <Field label="What it is made of">
          <select
            value={f.foliage}
            onChange={(e) => update(id, { foliage: e.target.value as typeof f.foliage })}
          >
            <option value="solid">Solid — stops nearly all light</option>
            <option value="evergreen">Evergreen — dense all year</option>
            <option value="deciduous">Deciduous — bare in winter, so far less shade</option>
          </select>
          <span className="meta-line">
            {f.foliage === 'deciduous'
              ? 'Modelled as stopping about a third as much light once the leaves are down.'
              : f.foliage === 'evergreen'
                ? 'Dense year-round, which is what makes conifers such expensive neighbours.'
                : 'A wall is a wall in January.'}
          </span>
        </Field>

        <label className="row" style={{ gap: 8, fontSize: 13 }}>
          <input
            type="checkbox" checked={f.occupiesGround} style={{ width: 'auto' }}
            onChange={(e) => update(id, { occupiesGround: e.target.checked })}
          />
          Takes up usable yard area
        </label>

        {victims.length > 0 && (
          <div className="card" style={{ padding: 12 }}>
            <header><h3>What this shades</h3></header>
            <table className="data">
              <tbody>
                {victims.map((v) => (
                  <tr key={v.placementId}>
                    <td>{v.name}</td>
                    <td>{pct(v.sunExposure)} of full sun</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="row">
          <button className="btn" onClick={() => setShadows({ on: true })}>
            Show its shadow
          </button>
          <span className="grow" />
          <button className="btn danger" onClick={() => remove(id)} aria-label="Remove">
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ZoneInspector() {
  const design = useApp((s) => s.design);
  const id = useApp((s) => s.selectedZoneId)!;
  const update = useApp((s) => s.updateZone);
  const remove = useApp((s) => s.removeZone);
  const selectZone = useApp((s) => s.selectZone);

  const z = design.zones.find((x) => x.id === id);
  if (!z) return null;

  return (
    <div className="sheet">
      <div className="grabber" />
      <header>
        <h2>{z.label || ZONE_LABEL[z.kind]}</h2>
        <span className="grow" />
        <button className="btn small" onClick={() => selectZone(null)} aria-label="Close">
          <Icon name="close" size={14} />
        </button>
      </header>
      <div className="sheet-body stack">
        <p className="card-note">{ZONE_BLURB[z.kind]}</p>

        <Field label="What this ground is">
          <select
            value={z.kind}
            onChange={(e) => update(id, { kind: e.target.value as ZoneKind })}
          >
            {(Object.keys(ZONE_LABEL) as ZoneKind[]).map((k) => (
              <option key={k} value={k}>{ZONE_LABEL[k]}</option>
            ))}
          </select>
        </Field>

        <Field label="Name">
          <input
            type="text" value={z.label ?? ''} placeholder={ZONE_LABEL[z.kind]}
            onChange={(e) => update(id, { label: e.target.value })}
          />
        </Field>

        <div className="row" style={{ gap: 10 }}>
          <Field label="Width" value={`${trimNum(z.w)} m`}>
            <input
              type="range" min={0.5} max={60} step={0.5} value={z.w}
              onChange={(e) => update(id, { w: Number(e.target.value) })}
            />
          </Field>
          <Field label="Depth" value={`${trimNum(z.d)} m`}>
            <input
              type="range" min={0.5} max={60} step={0.5} value={z.d}
              onChange={(e) => update(id, { d: Number(e.target.value) })}
            />
          </Field>
        </div>

        <p className="meta-line">
          Covers {Math.round(z.w * z.d)} m². Anything placed on it gets flagged in
          Results; nothing is docked automatically.
        </p>

        <div className="row">
          <span className="grow" />
          <button className="btn danger" onClick={() => remove(id)} aria-label="Remove">
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ inspector ------------------------------ */

function Inspector() {
  const design = useApp((s) => s.design);
  const id = useApp((s) => s.selectedPlacementId)!;
  const update = useApp((s) => s.updatePlacement);
  const remove = useApp((s) => s.removePlacement);
  const select = useApp((s) => s.select);
  const inspect = useApp((s) => s.inspect);
  const setTab = useApp((s) => s.setTab);
  const sim = useSimulation();

  const placement = design.placements.find((p) => p.id === id);
  const def = placement ? systemById(design, placement.systemId) : undefined;
  if (!placement || !def) return null;

  const report = sim.expected.placements.find((p) => p.placementId === id);
  const ground = def.footprintPerUnit * placement.units;
  const roof = (def.roofFootprintPerUnit ?? 0) * placement.units;

  const yearly = def.flows.map((f) => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const r = f.rate;
      total += r.kind === 'constant' ? r.perUnitPerMonth * placement.units
        : r.kind === 'annual' ? (r.perUnitPerYear * placement.units) / 12
        : sim.drivers[r.driver][m] * r.coefficient * placement.units;
    }
    return { flow: f, total };
  });

  return (
    <div className="sheet">
      <div className="grabber" />
      <header>
        <h2 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {placement.label || def.name}
        </h2>
        <span className="grow" />
        <button className="btn small" onClick={() => select(null)} aria-label="Close"><Icon name="close" size={14} /></button>
      </header>
      <div className="sheet-body stack">
        <div className="row wrap" style={{ gap: 6 }}>
          <EvidenceBadge tier={def.evidence} />
          <span className="chip">{CATEGORY_LABEL[def.category]}</span>
          {!placement.enabled && <span className="chip">Turned off</span>}
        </div>

        <p className="card-note">{def.summary}</p>

        <Field label="Size" value={`${trimNum(placement.units)} ${def.unitLabel}`}>
          <input
            type="range"
            min={def.unitMin} max={def.unitMax} step={def.unitStep}
            value={placement.units}
            onChange={(e) => update(id, { units: Number(e.target.value) })}
          />
        </Field>

        <Field label="Label">
          <input
            type="text"
            placeholder={def.name}
            value={placement.label ?? ''}
            onChange={(e) => update(id, { label: e.target.value })}
          />
        </Field>

        <div className="tiles">
          <div className="tile">
            <div className="label">Build cost</div>
            <div className="figure">{money(def.capitalPerUnit * placement.units)}</div>
            <div className="range">{money(def.upkeepCostPerUnitPerMonth * placement.units * 12)}/yr upkeep</div>
          </div>
          <div className="tile">
            <div className="label">Your time</div>
            <div className="figure">{compact(report?.laborHoursPerYear ?? 0)}<span style={{ fontSize: 14 }}> h/yr</span></div>
            <div className="range">{compact((report?.laborHoursPerYear ?? 0) / 52)} h per week</div>
          </div>
          <div className="tile">
            <div className="label">Sun it gets</div>
            <div className="figure">{pct(report?.sunExposure ?? 1)}</div>
            <div className="range">
              {report?.shadedBy
                ? `mostly ${report.shadedBy.label}`
                : (report?.sunExposure ?? 1) > 0.995 ? 'open sky' : 'lightly shaded'}
            </div>
          </div>
          <div className="tile">
            <div className="label">{roof > 0 ? 'Roof area' : 'Ground area'}</div>
            <div className="figure">{compact(roof > 0 ? roof : ground)}<span style={{ fontSize: 14 }}> m²</span></div>
            <div className="range">
              {pct((roof > 0 ? roof / Math.max(1, design.site.roofAreaM2) : ground / Math.max(1, design.site.lotAreaM2)))} of what you have
            </div>
          </div>
        </div>

        {report && report.runRate < 0.995 && (
          <div className="warn-item warn">
            <span className="glyph"><Icon name="alert" size={16} /></span>
            <span className="body">
              <span className="title">Running at {pct(report.runRate)}</span>
              <span className="detail">
                {report.limitedBy.length
                  ? `Short of ${report.limitedBy.map((r) => RESOURCES[r].label.toLowerCase()).join(' and ')}. Add a source, or make this one smaller.`
                  : 'Something upstream is limiting it.'}
              </span>
            </span>
          </div>
        )}

        <div className="card" style={{ padding: 12 }}>
          <header><h3>What it moves, per year</h3></header>
          <table className="data">
            <tbody>
              {yearly.map(({ flow, total }, i) => (
                <tr key={i}>
                  <td>
                    {flow.direction === 'produce' ? '↑' : '↓'} {RESOURCES[flow.resource].label}
                    {flow.optional && <span className="meta-line"> (if available)</span>}
                  </td>
                  <td style={{ color: flow.direction === 'produce' ? 'var(--success-text)' : 'var(--text-secondary)' }}>
                    {flow.direction === 'produce' ? '+' : '−'}{compact(total)} {RESOURCES[flow.resource].shortUnit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row">
          <button
            className="btn"
            onClick={() => update(id, { enabled: !placement.enabled })}
          >
            {placement.enabled ? 'Turn off' : 'Turn on'}
          </button>
          <button className="btn" onClick={() => { inspect(def.id); setTab('catalog'); }}>
            Evidence & sources
          </button>
          <span className="grow" />
          <button className="btn danger" onClick={() => remove(id)} aria-label="Remove">
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
