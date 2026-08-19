import { useMemo, useState } from 'react';
import { CATALOG } from '../engine/catalog';
import { EVIDENCE, EVIDENCE_ORDER, RESOURCES } from '../engine/resources';
import type { EvidenceTier, SystemCategory } from '../engine/types';
import { systemById, useApp, useSimulation } from '../state/store';
import {
  CATEGORY_ICON, CATEGORY_LABEL, compact, EvidenceBadge, Field, Icon, money, pct,
} from './common';
import { trimNum, YardCanvas } from './YardCanvas';

const CATEGORIES: SystemCategory[] = ['water', 'food', 'energy', 'sanitation', 'soil', 'shelter'];

export function DesignPane() {
  const selected = useApp((s) => s.selectedPlacementId);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="pane no-scroll" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <YardCanvas />

      {!selected && !paletteOpen && (
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
    </div>
  );
}

/* ------------------------------ palette ------------------------------ */

function PaletteSheet({ onClose }: { onClose: () => void }) {
  const design = useApp((s) => s.design);
  const addPlacement = useApp((s) => s.addPlacement);
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
        <h2>Add a system</h2>
        <span className="grow" />
        <button className="btn small" onClick={onClose} aria-label="Close"><Icon name="close" size={14} /></button>
      </header>
      <div className="sheet-body stack">
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
