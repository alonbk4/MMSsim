import { EVIDENCE, EVIDENCE_ORDER, RESOURCES, RESOURCE_ORDER } from '../engine/resources';
import type { SimResult } from '../engine/simulate';
import type { ResourceId } from '../engine/types';
import { useApp, useSimulation } from '../state/store';
import { MonthlyResourceChart } from './charts';
import { compact, EvidenceBadge, Icon, Meter, money, pct } from './common';

export function ResultsPane() {
  const sim = useSimulation();
  const design = useApp((s) => s.design);
  const setTab = useApp((s) => s.setTab);

  const goals = RESOURCE_ORDER.filter(
    (r) => RESOURCES[r].goal && sim.expected.resources[r].demanded > 0,
  );
  const shown = RESOURCE_ORDER.filter((r) => {
    const y = sim.expected.resources[r];
    return y.demanded > 0 || y.produced > 0;
  });

  if (design.placements.length === 0) {
    return (
      <div className="pane">
        <div className="pane-inner">
          <div className="card">
            <header><h2>Nothing placed yet</h2></header>
            <p className="card-note">
              Put some systems on the yard and this page will tell you, month by month,
              what they cover and what they do not.
            </p>
            <button className="btn primary" onClick={() => setTab('design')}>Go to the yard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pane">
      <div className="pane-inner">
        <div className="card">
          <header>
            <h2>How far this design gets you</h2>
            <span className="sub">share of each year's need met</span>
          </header>
          <div className="tiles">
            {goals.map((r) => (
              <CoverageTile key={r} resource={r} sim={sim} />
            ))}
          </div>
          <p className="card-note" style={{ marginTop: 10 }}>
            The smaller figure under each number is the range across the evidence tiers:
            the low end is what you get if every researched and unproven system comes in
            at the bottom of its band.
          </p>
        </div>

        {sim.warnings.length > 0 && (
          <div className="card">
            <header><h2>What to look at</h2></header>
            <div className="stack">
              {sim.warnings.map((w, i) => (
                <div key={i} className={`warn-item ${w.level}`}>
                  <span className="glyph">
                    <Icon name={w.level === 'info' ? 'info' : 'alert'} size={16} />
                  </span>
                  <span className="body">
                    <span className="title">{w.title}</span>
                    <span className="detail">{w.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <header><h2>What it costs</h2></header>
          <div className="tiles">
            <div className="tile">
              <div className="label">To build</div>
              <div className="figure">{money(sim.totals.capital)}</div>
              <div className="range">{money(sim.totals.upkeepPerYear)}/yr to keep running</div>
            </div>
            <div className="tile">
              <div className="label">Your time</div>
              <div className="figure">{compact(sim.totals.laborHoursPerYear / 52)}<span style={{ fontSize: 15 }}> h/wk</span></div>
              <div className="range">{compact(sim.totals.laborHoursPerYear)} hours a year</div>
            </div>
            <div className="tile">
              <div className="label">Ground used</div>
              <div className="figure">{pct(sim.totals.footprintM2 / Math.max(1, sim.totals.lotAreaM2))}</div>
              <div className="range">{Math.round(sim.totals.footprintM2)} of {Math.round(sim.totals.lotAreaM2)} m²</div>
              <div style={{ marginTop: 6 }}>
                <Meter
                  value={sim.totals.footprintM2 / Math.max(1, sim.totals.lotAreaM2)}
                  tone={sim.totals.footprintM2 > sim.totals.lotAreaM2 ? 'warn' : 'accent'}
                />
              </div>
            </div>
            <div className="tile">
              <div className="label">Roof used</div>
              <div className="figure">{pct(sim.totals.roofM2 / Math.max(1, sim.totals.roofAreaM2))}</div>
              <div className="range">{Math.round(sim.totals.roofM2)} of {Math.round(sim.totals.roofAreaM2)} m²</div>
              <div style={{ marginTop: 6 }}>
                <Meter
                  value={sim.totals.roofM2 / Math.max(1, sim.totals.roofAreaM2)}
                  tone={sim.totals.roofM2 > sim.totals.roofAreaM2 ? 'warn' : 'accent'}
                />
              </div>
            </div>
          </div>
        </div>

        <EvidenceCard sim={sim} />

        {shown.map((r) => (
          <div className="card" key={r}>
            <header>
              <h2>{RESOURCES[r].label}</h2>
              <span className="sub">{RESOURCES[r].unit}</span>
            </header>
            <MonthlyResourceChart
              resource={r}
              expected={sim.expected.resources[r]}
              low={sim.low.resources[r]}
              high={sim.high.resources[r]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverageTile({ resource, sim }: { resource: ResourceId; sim: SimResult }) {
  const meta = RESOURCES[resource];
  const e = sim.expected.resources[resource];
  const lo = sim.low.resources[resource];
  const hi = sim.high.resources[resource];
  const risky = e.coverage > 0.95 && lo.coverage < 0.8;
  return (
    <div className="tile">
      <div className="label">{meta.label}</div>
      <div className="figure">{pct(e.coverage)}</div>
      <div className="range">
        {pct(lo.coverage)}–{pct(hi.coverage)} across the evidence range
      </div>
      <div style={{ marginTop: 7 }}>
        <Meter value={e.coverage} tone={risky || e.coverage < 0.5 ? 'warn' : 'accent'} />
      </div>
      {e.shortMonths.length > 0 && (
        <div className="range" style={{ marginTop: 5 }}>
          Short in {e.shortMonths.length} month{e.shortMonths.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ sim }: { sim: SimResult }) {
  const total = EVIDENCE_ORDER.reduce((a, t) => a + sim.evidenceMix[t], 0);
  if (total === 0) return null;
  return (
    <div className="card">
      <header><h2>How much of this is actually known</h2></header>
      <div className="stack">
        {EVIDENCE_ORDER.map((t) => {
          const n = sim.evidenceMix[t];
          return (
            <div key={t} className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 108, flex: 'none' }}><EvidenceBadge tier={t} /></span>
              <span className="grow">
                <span className="row" style={{ gap: 6 }}>
                  <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</strong>
                  <span className="meta-line">
                    of {total} placed {total === 1 ? 'system' : 'systems'}
                    {' · ×'}{EVIDENCE[t].low}–{EVIDENCE[t].high} output band
                  </span>
                </span>
                <span className="detail card-note" style={{ fontSize: 12.5 }}>{EVIDENCE[t].blurb}</span>
              </span>
            </div>
          );
        })}
        {sim.evidenceMix.proven === 0 && (
          <p className="card-note" style={{ marginBottom: 0 }}>
            Nothing in this design is proven on your site yet. As you build and measure
            something, promote it in the Catalog tab and enter your own numbers — the
            bands narrow and the results stop being a literature review.
          </p>
        )}
      </div>
    </div>
  );
}
