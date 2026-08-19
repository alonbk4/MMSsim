import { useMemo, useState } from 'react';
import { CATALOG, CATALOG_BY_ID } from '../engine/catalog';
import { buildDrivers } from '../engine/climate';
import { EVIDENCE, EVIDENCE_ORDER, RESOURCES } from '../engine/resources';
import { annualPerUnit, buildSeasonProfiles } from '../engine/simulate';
import type { EvidenceTier, SystemCategory, SystemDef } from '../engine/types';
import { systemById, useApp } from '../state/store';
import {
  CATEGORY_ICON, CATEGORY_LABEL, compact, EvidenceBadge, Field, Icon, lower, money,
} from './common';
import { trimNum } from './YardCanvas';

const CATEGORIES: SystemCategory[] = ['water', 'food', 'energy', 'sanitation', 'soil', 'shelter'];

export function CatalogPane() {
  const design = useApp((s) => s.design);
  const inspected = useApp((s) => s.inspectedSystemId);
  const inspect = useApp((s) => s.inspect);
  const [category, setCategory] = useState<SystemCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const systems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...CATALOG, ...design.customSystems]
      .map((s) => systemById(design, s.id)!)
      .filter((s) => category === 'all' || s.category === category)
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [design, category, query]);

  if (inspected) {
    const def = systemById(design, inspected);
    if (def) return <SystemDetail def={def} onBack={() => inspect(null)} />;
  }

  const counts = EVIDENCE_ORDER.map((t) => ({
    tier: t,
    n: [...CATALOG, ...design.customSystems]
      .map((s) => systemById(design, s.id)!)
      .filter((s) => s.evidence === t).length,
  }));

  return (
    <div className="pane">
      <div className="pane-inner">
        <div className="card">
          <header><h2>The catalog</h2></header>
          <p className="card-note">
            Every system the simulator knows about, and how much anyone actually knows
            about it. Open one to read what its numbers rest on — and to replace them
            with yours once you have built it here.
          </p>
          <div className="row wrap" style={{ marginTop: 8 }}>
            {counts.map(({ tier, n }) => (
              <span key={tier} className="row" style={{ gap: 5 }}>
                <EvidenceBadge tier={tier} />
                <span className="meta-line">{n}</span>
              </span>
            ))}
          </div>
        </div>

        <input
          type="text" placeholder="Search systems…"
          value={query} onChange={(e) => setQuery(e.target.value)}
        />

        <div className="row wrap">
          <button className="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <div className="stack">
          {systems.map((s) => (
            <button key={s.id} className="sys-row" onClick={() => inspect(s.id)}>
              <span className="icon"><Icon name={CATEGORY_ICON[s.category]} size={17} /></span>
              <span className="grow">
                <span className="row" style={{ gap: 6 }}>
                  <span className="name grow">{s.name}</span>
                  <EvidenceBadge tier={s.evidence} />
                </span>
                <span className="desc">{s.summary}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SystemDetail({ def, onBack }: { def: SystemDef; onBack: () => void }) {
  const design = useApp((s) => s.design);
  const setOverride = useApp((s) => s.setOverride);
  const addPlacement = useApp((s) => s.addPlacement);
  const setTab = useApp((s) => s.setTab);
  const inspect = useApp((s) => s.inspect);
  const override = design.overrides[def.id];
  const base = CATALOG_BY_ID[def.id] ?? def;

  const drivers = buildDrivers(design.site);
  const seasons = buildSeasonProfiles(design.site, drivers);

  const [editing, setEditing] = useState(false);

  return (
    <div className="pane">
      <div className="pane-inner">
        <div className="row">
          <button className="btn small" onClick={onBack}>← All systems</button>
          <span className="grow" />
          <EvidenceBadge tier={def.evidence} />
        </div>

        <div className="card">
          <header>
            <span className="icon" style={{
              width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center',
              background: 'var(--accent-soft)', color: 'var(--accent-ink)',
            }}>
              <Icon name={CATEGORY_ICON[def.category]} size={18} />
            </span>
            <h2>{def.name}</h2>
          </header>
          <p className="card-note">{def.summary}</p>
          <div className="meta-line" style={{ marginTop: 6 }}>
            Sized in {def.unitLabel} · {money(def.capitalPerUnit)} per unit ·{' '}
            {def.footprintPerUnit > 0
              ? `${trimNum(def.footprintPerUnit)} m² of ground per unit`
              : def.roofFootprintPerUnit
                ? `${trimNum(def.roofFootprintPerUnit)} m² of roof per unit`
                : 'no footprint'}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className="btn primary"
              onClick={() => { addPlacement(def.id); inspect(null); setTab('design'); }}
            >
              Add to the yard
            </button>
          </div>
        </div>

        <div className="card">
          <header>
            <h2>What it moves</h2>
            <span className="sub">per unit, per year, at this site</span>
          </header>
          <table className="data">
            <tbody>
              {def.flows.map((f, i) => (
                <tr key={i}>
                  <td>
                    {f.direction === 'produce' ? '↑ Gives' : '↓ Takes'} {lower(RESOURCES[f.resource].label)}
                    {f.optional && <span className="meta-line"> (only if spare)</span>}
                  </td>
                  <td style={{ color: f.direction === 'produce' ? 'var(--success-text)' : 'var(--text-secondary)' }}>
                    {f.direction === 'produce' ? '+' : '−'}
                    {compact(annualPerUnit(f.rate, drivers, seasons))}{' '}
                    {RESOURCES[f.resource].shortUnit}
                  </td>
                </tr>
              ))}
              {def.storage && (
                <tr>
                  <td>▣ Stores {lower(RESOURCES[def.storage.resource].label)}</td>
                  <td>{compact(def.storage.capacityPerUnit)} {RESOURCES[def.storage.resource].shortUnit}</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="meta-line" style={{ marginTop: 8 }}>
            Climate-driven figures change with the Site tab — this is what one unit does
            in {design.site.name || 'your climate'}, not a universal constant.
          </p>
        </div>

        <div className="card">
          <header><h2>Why it sits in this tier</h2></header>
          <p className="card-note">{def.notes}</p>
          <p className="meta-line" style={{ marginTop: 6 }}>
            {EVIDENCE[def.evidence].blurb}
          </p>
          <h3 style={{ marginTop: 12, marginBottom: 4 }}>Where the numbers come from</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13 }}>
            {def.sources.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>

        <div className="card">
          <header>
            <h2>Your numbers</h2>
            <span className="sub">{override ? 'edited' : 'untouched'}</span>
          </header>
          {def.evidence === 'proven' ? (
            <p className="card-note">
              This one runs on your numbers. Its band is ±10% instead of the
              ±{Math.round((1 - EVIDENCE[base.evidence].low) * 100)}% the catalog
              default carries — keep it honest by updating the figures as the seasons
              come in.
            </p>
          ) : (
            <p className="card-note">
              Once this is built and measured here, move it to <strong>Proven here</strong> and
              put your own figures in. That narrows its uncertainty band from
              ±{Math.round((1 - EVIDENCE[def.evidence].low) * 100)}% to ±10%, and every
              result in the app stops leaning on someone else's yard.
            </p>
          )}

          <div className="row wrap" style={{ marginTop: 8 }}>
            {EVIDENCE_ORDER.map((t) => (
              <button
                key={t}
                className="chip"
                aria-pressed={def.evidence === t}
                onClick={() => setOverride(def.id, { evidence: t })}
              >
                {EVIDENCE[t].label}
              </button>
            ))}
          </div>

          {!editing && (
            <button className="btn small" style={{ marginTop: 10 }} onClick={() => setEditing(true)}>
              Enter measured numbers
            </button>
          )}

          {editing && (
            <div className="stack" style={{ marginTop: 12 }}>
              <Field
                label="Output vs the catalog figure"
                value={`${Math.round((override?.yieldFactor ?? 1) * 100)}%`}
              >
                <input
                  type="range" min={0.1} max={2} step={0.05}
                  value={override?.yieldFactor ?? 1}
                  onChange={(e) => setOverride(def.id, { yieldFactor: Number(e.target.value) })}
                />
                <span className="meta-line">
                  The quickest correction: the book says one thing, your yard says another.
                </span>
              </Field>

              <Field label={`Build cost per ${def.unitLabel}`}>
                <input
                  type="number"
                  value={override?.capitalPerUnit ?? def.capitalPerUnit}
                  onChange={(e) => setOverride(def.id, { capitalPerUnit: Number(e.target.value) })}
                />
              </Field>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 550 }}>
                  Measured yearly figures, per {def.unitLabel}
                </label>
                <div className="stack" style={{ marginTop: 6 }}>
                  {def.flows.filter((f) => f.resource !== 'labor').map((f) => {
                    const key = `${f.direction}:${f.resource}`;
                    const current = override?.flowOverrides?.[key]
                      ?? annualPerUnit(
                        (CATALOG_BY_ID[def.id] ?? def).flows
                          .find((g) => `${g.direction}:${g.resource}` === key)!.rate,
                        drivers, seasons,
                      );
                    return (
                      <Field
                        key={key}
                        label={`${f.direction === 'produce' ? 'Gives' : 'Takes'} ${RESOURCES[f.resource].label} (${RESOURCES[f.resource].shortUnit}/yr)`}
                      >
                        <input
                          type="number"
                          value={Number(current.toFixed(3))}
                          onChange={(e) =>
                            setOverride(def.id, {
                              flowOverrides: {
                                ...override?.flowOverrides,
                                [key]: Number(e.target.value),
                              },
                            })}
                        />
                      </Field>
                    );
                  })}
                </div>
              </div>

              <Field label="Your notes on this system">
                <textarea
                  rows={4}
                  placeholder="What you built, when, what actually happened."
                  value={override?.notes ?? ''}
                  onChange={(e) => setOverride(def.id, { notes: e.target.value })}
                />
              </Field>

              <div className="row">
                <button className="btn small" onClick={() => setEditing(false)}>Done</button>
                <span className="grow" />
                {override && (
                  <button
                    className="btn small danger"
                    onClick={() => { setOverride(def.id, null); setEditing(false); }}
                  >
                    Reset to catalog
                  </button>
                )}
              </div>
            </div>
          )}

          {override && !editing && (
            <div className="meta-line" style={{ marginTop: 8 }}>
              Overridden: {[
                override.evidence && `tier → ${EVIDENCE[override.evidence as EvidenceTier].label}`,
                override.yieldFactor && override.yieldFactor !== 1 && `output → ${Math.round(override.yieldFactor * 100)}%`,
                override.capitalPerUnit !== undefined && override.capitalPerUnit !== base.capitalPerUnit && 'build cost',
                override.flowOverrides && Object.keys(override.flowOverrides).length && `${Object.keys(override.flowOverrides).length} measured flows`,
                override.notes && 'notes',
              ].filter(Boolean).join(' · ') || 'no changes'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
