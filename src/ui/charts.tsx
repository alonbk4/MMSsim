import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { MONTHS } from '../engine/climate';
import { RESOURCES } from '../engine/resources';
import type { ResourceYear } from '../engine/simulate';
import type { ResourceId } from '../engine/types';
import { compact } from './common';

/** Width-aware container: charts are drawn at real pixel width so type never
 *  stretches, and they re-draw when the pane or the phone rotates. */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

interface TooltipState {
  month: number;
  x: number;
  y: number;
}

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max * 1.0001; v += step) ticks.push(v);
  return ticks;
}

/**
 * One resource, twelve months.
 *
 * Bars are what the design produces, the line is what it needs, and the third
 * series is what is sitting in storage at month end. All three are the same
 * unit on one axis — there is deliberately no second y-scale anywhere in this
 * app. The whisker on each bar is the evidence band: how far output could fall
 * if the researched and unproven systems come in at the low end.
 */
export function MonthlyResourceChart({
  resource, expected, low, high, height = 168,
}: {
  resource: ResourceId;
  expected: ResourceYear;
  low: ResourceYear;
  high: ResourceYear;
  height?: number;
}) {
  const meta = RESOURCES[resource];
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [tip, setTip] = useState<TooltipState | null>(null);
  const showStock = expected.capacity > 0;

  const pad = { top: 10, right: 10, bottom: 22, left: 42 };
  const w = Math.max(240, width);
  const plotW = w - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxima = expected.months.map((m, i) => Math.max(
    high.months[i]?.produced ?? 0, m.produced, m.demanded, showStock ? m.stockEnd : 0,
  ));
  const rawMax = Math.max(1e-9, ...maxima);
  const ticks = niceTicks(rawMax);
  const top = Math.max(rawMax, ticks[ticks.length - 1]);
  const y = (v: number) => pad.top + plotH - (v / top) * plotH;
  const band = plotW / 12;
  const barW = Math.max(4, Math.min(20, band * 0.5));
  const cx = (i: number) => pad.left + band * (i + 0.5);

  const onMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const idx = Math.floor((px - pad.left) / band);
    if (idx < 0 || idx > 11) { setTip(null); return; }
    setTip({ month: idx, x: cx(idx), y: e.clientY - rect.top });
  }, [band, pad.left, plotW]);

  const stockPath = showStock
    ? expected.months.map((m, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(m.stockEnd).toFixed(1)}`).join(' ')
    : '';
  const demandPath = expected.months
    .map((m, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(m.demanded).toFixed(1)}`)
    .join(' ');

  const anyDemand = expected.demanded > 0;

  return (
    <div ref={ref}>
      <svg
        width={w} height={height} role="img"
        aria-label={`${meta.label} by month, in ${meta.unit}`}
        onPointerMove={onMove}
        onPointerLeave={() => setTip(null)}
        style={{ touchAction: 'pan-y' }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)}
              stroke="var(--gridline)" strokeWidth="1"
            />
            <text
              x={pad.left - 6} y={y(t) + 3.5} textAnchor="end"
              className="plot-sub" style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {compact(t)}
            </text>
          </g>
        ))}

        {expected.months.map((m, i) => {
          const h = Math.max(0, y(0) - y(m.produced));
          const lowV = low.months[i]?.produced ?? m.produced;
          const highV = high.months[i]?.produced ?? m.produced;
          const short = m.shortfall > Math.max(1e-9, m.demanded * 0.005);
          return (
            <g key={i}>
              {h > 0 && (
                <rect
                  x={cx(i) - barW / 2} y={y(m.produced)} width={barW} height={h}
                  rx={Math.min(4, barW / 2)} fill="var(--series-1)"
                  opacity={tip && tip.month !== i ? 0.55 : 1}
                />
              )}
              {highV - lowV > top * 0.01 && (
                <g stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <line x1={cx(i)} x2={cx(i)} y1={y(lowV)} y2={y(highV)} />
                  <line x1={cx(i) - 3} x2={cx(i) + 3} y1={y(highV)} y2={y(highV)} />
                  <line x1={cx(i) - 3} x2={cx(i) + 3} y1={y(lowV)} y2={y(lowV)} />
                </g>
              )}
              {short && (
                <line
                  x1={cx(i) - barW / 2} x2={cx(i) + barW / 2}
                  y1={y(0) + 3} y2={y(0) + 3}
                  stroke="var(--status-critical)" strokeWidth="2.5" strokeLinecap="round"
                />
              )}
            </g>
          );
        })}

        {showStock && (
          <path d={stockPath} fill="none" stroke="var(--series-3)" strokeWidth="2" strokeLinejoin="round" />
        )}
        {anyDemand && (
          <path
            d={demandPath} fill="none" stroke="var(--series-2)" strokeWidth="2"
            strokeLinejoin="round" strokeDasharray="1 0"
          />
        )}

        <line
          x1={pad.left} x2={w - pad.right} y1={y(0)} y2={y(0)}
          stroke="var(--baseline)" strokeWidth="1"
        />
        {MONTHS.map((mo, i) => (
          (i % 2 === 0 || band > 26) && (
            <text key={mo} x={cx(i)} y={height - 7} textAnchor="middle" className="plot-sub">
              {mo[0]}
            </text>
          )
        ))}

        {tip && (
          <line
            x1={cx(tip.month)} x2={cx(tip.month)} y1={pad.top} y2={y(0)}
            stroke="var(--border-strong)" strokeWidth="1"
          />
        )}
      </svg>

      {tip && (
        <MonthTooltip
          resource={resource}
          month={tip.month}
          expected={expected}
          low={low}
          high={high}
          showStock={showStock}
        />
      )}

      <div className="legend" style={{ marginTop: 4 }}>
        <span className="key"><span className="swatch" style={{ background: 'var(--series-1)' }} /> Produced</span>
        {anyDemand && (
          <span className="key"><span className="swatch line" style={{ background: 'var(--series-2)' }} /> Needed</span>
        )}
        {showStock && (
          <span className="key"><span className="swatch line" style={{ background: 'var(--series-3)' }} /> In storage</span>
        )}
        <span className="key"><span className="swatch line" style={{ background: 'var(--text-muted)', width: 2, height: 10 }} /> Evidence range</span>
      </div>

      <details className="disclosure">
        <summary>Show the numbers ({meta.unit})</summary>
        <div className="scroll-x">
          <table className="data">
            <thead>
              <tr>
                <th>Month</th><th>Produced</th><th>Needed</th>
                {showStock && <th>Stored</th>}<th>Short by</th>
              </tr>
            </thead>
            <tbody>
              {expected.months.map((m, i) => (
                <tr key={i}>
                  <td>{MONTHS[i]}</td>
                  <td>{compact(m.produced)}</td>
                  <td>{compact(m.demanded)}</td>
                  {showStock && <td>{compact(m.stockEnd)}</td>}
                  <td style={{ color: m.shortfall > 0 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                    {m.shortfall > 0 ? compact(m.shortfall) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function MonthTooltip({
  resource, month, expected, low, high, showStock,
}: {
  resource: ResourceId; month: number;
  expected: ResourceYear; low: ResourceYear; high: ResourceYear;
  showStock: boolean;
}) {
  const meta = RESOURCES[resource];
  const m = expected.months[month];
  const lo = low.months[month];
  const hi = high.months[month];
  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 10,
        background: 'var(--surface-2)', padding: '8px 10px',
        fontSize: 12.5, marginTop: 6,
      }}
    >
      <strong>{MONTHS[month]}</strong>{' · '}
      <span style={{ color: 'var(--text-secondary)' }}>{meta.unit}</span>
      <div style={{ marginTop: 4, display: 'grid', gap: 2 }}>
        <span>
          <span style={{ color: 'var(--series-1)' }}>■</span> Produced{' '}
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{compact(m.produced)}</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>
            ({compact(lo?.produced ?? 0)}–{compact(hi?.produced ?? 0)} across the evidence range)
          </span>
        </span>
        {m.demanded > 0 && (
          <span>
            <span style={{ color: 'var(--series-2)' }}>▬</span> Needed{' '}
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{compact(m.demanded)}</strong>
          </span>
        )}
        {showStock && (
          <span>
            <span style={{ color: 'var(--series-3)' }}>▬</span> In storage{' '}
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{compact(m.stockEnd)}</strong>
            {' of '}{compact(m.capacity)}
          </span>
        )}
        {m.shortfall > 0 && (
          <span style={{ color: 'var(--status-critical)' }}>
            ⚠ Short by <strong>{compact(m.shortfall)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

/** Two mm-per-month series on one axis: what falls, and what evaporates. */
export function ClimateChart({
  rainfall, eto, height = 130,
}: { rainfall: number[]; eto: number[]; height?: number }) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const pad = { top: 8, right: 8, bottom: 20, left: 36 };
  const w = Math.max(240, width);
  const plotW = w - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const top = Math.max(1, ...rainfall, ...eto);
  const ticks = niceTicks(top, 3);
  const scaleTop = Math.max(top, ticks[ticks.length - 1]);
  const y = (v: number) => pad.top + plotH - (v / scaleTop) * plotH;
  const band = plotW / 12;
  const cx = (i: number) => pad.left + band * (i + 0.5);
  const barW = Math.max(4, Math.min(18, band * 0.52));

  return (
    <div ref={ref}>
      <svg width={w} height={height} role="img" aria-label="Rainfall and evaporative demand by month, millimetres">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} stroke="var(--gridline)" />
            <text x={pad.left - 5} y={y(t) + 3.5} textAnchor="end" className="plot-sub">{compact(t)}</text>
          </g>
        ))}
        {rainfall.map((v, i) => (
          <rect
            key={i} x={cx(i) - barW / 2} y={y(v)} width={barW}
            height={Math.max(0, y(0) - y(v))} rx={Math.min(4, barW / 2)}
            fill="var(--series-1)"
          />
        ))}
        <path
          d={eto.map((v, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
          fill="none" stroke="var(--series-2)" strokeWidth="2" strokeLinejoin="round"
        />
        <line x1={pad.left} x2={w - pad.right} y1={y(0)} y2={y(0)} stroke="var(--baseline)" />
        {MONTHS.map((mo, i) => (
          <text key={mo} x={cx(i)} y={height - 6} textAnchor="middle" className="plot-sub">{mo[0]}</text>
        ))}
      </svg>
      <div className="legend">
        <span className="key"><span className="swatch" style={{ background: 'var(--series-1)' }} /> Rain (mm)</span>
        <span className="key"><span className="swatch line" style={{ background: 'var(--series-2)' }} /> Evaporative demand (mm)</span>
      </div>
    </div>
  );
}
