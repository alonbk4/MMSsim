import { useCallback, useEffect, useRef, useState } from 'react';
import { CATALOG_BY_ID } from '../engine/catalog';
import type { PlacementReport } from '../engine/simulate';
import { systemById, useApp, useSimulation } from '../state/store';
import { CATEGORY_ICON, Icon } from './common';
import { hash, planFootprint } from './plan/geometry';
import { paintPlan, PlanDefs } from './plan/painters';

export function YardCanvas() {
  const design = useApp((s) => s.design);
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const selected = useApp((s) => s.selectedPlacementId);
  const select = useApp((s) => s.select);
  const move = useApp((s) => s.movePlacement);
  const setSite = useApp((s) => s.setSite);
  const sim = useSimulation();

  const site = design.site;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ w: 320, h: 420 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: 'none' }
    | { kind: 'pan'; startX: number; startY: number; originX: number; originY: number }
    | { kind: 'drag'; id: string; dx: number; dy: number; moved: boolean }
    | { kind: 'house'; dx: number; dy: number }
    | { kind: 'pinch'; dist: number; scale: number; cx: number; cy: number; x: number; y: number }
  >({ kind: 'none' });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toWorld = useCallback(
    (px: number, py: number) => ({ x: (px - view.x) / view.scale, y: (py - view.y) / view.scale }),
    [view],
  );

  const local = (e: React.PointerEvent<Element>) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const reports = new Map<string, PlacementReport>(
    sim.expected.placements.map((p) => [p.placementId, p]),
  );

  const onPointerDown = (
    e: React.PointerEvent<Element>, placementId?: string, house?: boolean,
  ) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (!touched) { setTouched(true); setView({ fitted: true }); }
    const pt = local(e);
    pointers.current.set(e.pointerId, pt);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        kind: 'pinch',
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
        x: view.x,
        y: view.y,
      };
      return;
    }

    if (house) {
      const w = toWorld(pt.x, pt.y);
      gesture.current = { kind: 'house', dx: w.x - site.houseX, dy: w.y - site.houseY };
      select(null);
      return;
    }
    if (placementId) {
      const p = design.placements.find((q) => q.id === placementId)!;
      const w = toWorld(pt.x, pt.y);
      gesture.current = { kind: 'drag', id: placementId, dx: w.x - p.x, dy: w.y - p.y, moved: false };
      select(placementId);
    } else {
      gesture.current = { kind: 'pan', startX: pt.x, startY: pt.y, originX: view.x, originY: view.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const pt = local(e);
    pointers.current.set(e.pointerId, pt);
    const g = gesture.current;

    if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const next = clampScale((g.scale * dist) / (g.dist || 1));
      const k = next / g.scale;
      setView({
        scale: next,
        x: g.cx - (g.cx - g.x) * k,
        y: g.cy - (g.cy - g.y) * k,
      });
      return;
    }
    if (g.kind === 'pan') {
      setView({ x: g.originX + (pt.x - g.startX), y: g.originY + (pt.y - g.startY) });
      return;
    }
    if (g.kind === 'house') {
      const w = toWorld(pt.x, pt.y);
      const snap = (v: number) => Math.round(v * 2) / 2;
      setSite({ houseX: snap(w.x - g.dx), houseY: snap(w.y - g.dy) });
      return;
    }
    if (g.kind === 'drag') {
      const w = toWorld(pt.x, pt.y);
      const snap = (v: number) => Math.round(v * 2) / 2;
      move(g.id, snap(w.x - g.dx), snap(w.y - g.dy));
      gesture.current = { ...g, moved: true };
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = { kind: 'none' };
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!touched) { setTouched(true); setView({ fitted: true }); }
    const r = svgRef.current!.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const next = clampScale(view.scale * Math.exp(-e.deltaY * 0.0015));
    const k = next / view.scale;
    setView({ scale: next, x: px - (px - view.x) * k, y: py - (py - view.y) * k });
  };

  const lotW = Math.max(4, site.lotWidthM);
  const lotH = Math.max(4, site.lotAreaM2 / lotW);

  const [touched, setTouched] = useState(false);

  const fit = useCallback(() => {
    const margin = 28;
    const scale = clampScale(Math.min(
      (size.w - margin * 2) / (lotW + 2),
      (size.h - margin * 2) / (lotH + 2),
    ));
    setView({
      scale,
      x: (size.w - lotW * scale) / 2,
      y: (size.h - lotH * scale) / 2,
    });
  }, [size, lotW, lotH, setView]);

  // Keep the yard framed until the first pan, zoom or drag — including through
  // a late layout pass or a rotation — then leave the viewport alone.
  useEffect(() => {
    if (touched || view.fitted || size.w < 40 || size.h < 40) return;
    fit();
  }, [size.w, size.h, fit, touched, view.fitted]);

  const gridStep = view.scale > 26 ? 1 : view.scale > 11 ? 5 : 10;
  const X = (m: number) => m * view.scale + view.x;
  const Y = (m: number) => m * view.scale + view.y;

  const gridLines: React.ReactElement[] = [];
  const startX = Math.floor(-view.x / view.scale / gridStep) * gridStep;
  const endX = startX + Math.ceil(size.w / view.scale / gridStep + 1) * gridStep;
  for (let m = startX; m <= endX; m += gridStep) {
    gridLines.push(<line key={`v${m}`} x1={X(m)} x2={X(m)} y1={0} y2={size.h} stroke="var(--gridline)" strokeWidth={m === 0 ? 1.4 : 1} />);
  }
  const startY = Math.floor(-view.y / view.scale / gridStep) * gridStep;
  const endY = startY + Math.ceil(size.h / view.scale / gridStep + 1) * gridStep;
  for (let m = startY; m <= endY; m += gridStep) {
    gridLines.push(<line key={`h${m}`} x1={0} x2={size.w} y1={Y(m)} y2={Y(m)} stroke="var(--gridline)" strokeWidth={m === 0 ? 1.4 : 1} />);
  }

  return (
    <div className="canvas-wrap">
      <svg
        ref={svgRef}
        onPointerDown={(e) => onPointerDown(e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <g>{gridLines}</g>

        {/* The lot boundary. Anything outside it is not on your land. */}
        <rect
          x={X(0)} y={Y(0)} width={lotW * view.scale} height={lotH * view.scale}
          fill="color-mix(in oklab, var(--accent) 7%, transparent)"
          stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="6 4" rx="4"
        />
        <text x={X(0) + 6} y={Y(lotH) - 7} className="plot-sub">
          {Math.round(lotW)} × {Math.round(lotH)} m · {Math.round(site.lotAreaM2)} m²
        </text>

        <PlanDefs />

        {/* The sunny side. Climate presets are northern-hemisphere, so the
            south edge is the bottom of the plan — the side you keep clear. */}
        <SunSide x={X(0)} y={Y(lotH)} w={lotW * view.scale} />

        <House
          x={X(site.houseX)} y={Y(site.houseY)}
          areaM2={site.roofAreaM2} scale={view.scale}
          onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, undefined, true); }}
        />

        {design.placements.map((p) => {
          const def = systemById(design, p.systemId);
          if (!def) return null;
          const fp = planFootprint(def, p);
          const px = X(p.x), py = Y(p.y);
          const wPx = fp.w * view.scale, hPx = fp.h * view.scale;
          const isSel = selected === p.id;
          const report = reports.get(p.id);
          const starved = report ? report.runRate < 0.9 : false;
          const short = Math.min(wPx, hPx);
          return (
            <g
              key={p.id}
              className={`cat-${def.category}`}
              onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, p.id); }}
              style={{ cursor: 'grab', opacity: p.enabled ? 1 : 0.4 }}
            >
              {/* The plan is drawn in metres and scaled here, so a swale is a
                  swale at every zoom and the areas stay exactly what the
                  engine says they are. */}
              <g transform={`translate(${px.toFixed(2)},${py.toFixed(2)}) scale(${view.scale})`}>
                {/* Bounding hit area — cluster and blob outlines are too thin
                    to grab reliably on a touchscreen. */}
                <rect width={fp.w} height={fp.h} fill="transparent" />
                {paintPlan({
                  def, fp, selected: isSel, starved,
                  scale: view.scale, seed: hash(p.id),
                })}
              </g>

              {isSel && (
                <rect
                  x={px - 4} y={py - 4} width={wPx + 8} height={hPx + 8}
                  rx={8} fill="none" stroke="var(--text-primary)"
                  strokeWidth="1.5" strokeDasharray="4 3" opacity="0.55"
                />
              )}

              {short > 52 ? (
                <>
                  <text
                    x={px + wPx / 2} y={py + hPx / 2 + (short > 76 ? -2 : 4)} textAnchor="middle"
                    className="plot-label"
                    style={{ fontWeight: 600, fontSize: nameSize(short), paintOrder: 'stroke',
                             stroke: 'var(--surface-1)', strokeWidth: 3, strokeLinejoin: 'round' }}
                  >
                    {truncate(p.label || def.name, charBudget(wPx, short))}
                  </text>
                  {short > 76 && (
                    <text
                      x={px + wPx / 2} y={py + hPx / 2 + 12} textAnchor="middle" className="plot-sub"
                      style={{ fontSize: Math.min(9.5, nameSize(short) - 1), paintOrder: 'stroke',
                               stroke: 'var(--surface-1)', strokeWidth: 3, strokeLinejoin: 'round' }}
                    >
                      {trimNum(p.units)} {def.unitLabel}
                    </text>
                  )}
                </>
              ) : isSel && (
                <text x={px + wPx / 2} y={py + hPx + 13} textAnchor="middle" className="plot-sub">
                  {truncate(p.label || def.name, 18)}
                </text>
              )}

              {starved && (
                <circle
                  cx={px + wPx - 5} cy={py + 5} r="5"
                  fill="var(--status-serious)" stroke="var(--surface-1)" strokeWidth="1.5"
                />
              )}
              {fp.onRoof && short > 96 && (
                <text x={px + wPx / 2} y={py + hPx - 6} textAnchor="middle" className="plot-sub">
                  on the roof
                </text>
              )}
            </g>
          );
        })}

        <NorthArrow x={size.w - 34} y={size.h - 78} />
        <ScaleBar x={14} y={size.h - 18} scale={view.scale} />
      </svg>

      <div className="canvas-hud">
        <span className="pill">{gridStep} m grid</span>
        <span className="pill">
          {Math.round(sim.totals.footprintM2)} / {Math.round(site.lotAreaM2)} m² used
        </span>
      </div>
      <div className="canvas-tools">
        <button onClick={() => setView({ scale: clampScale(view.scale * 1.3) })} aria-label="Zoom in"><Icon name="zoomIn" /></button>
        <button onClick={() => setView({ scale: clampScale(view.scale / 1.3) })} aria-label="Zoom out"><Icon name="zoomOut" /></button>
        <button onClick={fit} aria-label="Fit yard to screen"><Icon name="fit" /></button>
      </div>
    </div>
  );
}

function clampScale(v: number) {
  return Math.max(2, Math.min(60, v));
}

/** Labels shrink with their plot so a 3 m² bin does not shout like a food forest. */
function nameSize(shortPx: number): number {
  return shortPx > 92 ? 11 : shortPx > 66 ? 10 : 9;
}

function charBudget(widthPx: number, shortPx: number): number {
  return Math.max(4, Math.floor((widthPx - 8) / (nameSize(shortPx) * 0.63)));
}

/**
 * The house, sized from the roof area you gave it on the Site tab. It is the
 * one thing on the plan everybody can locate instantly, which is most of why
 * it is here — and roof-mounted systems have somewhere to sit.
 */
function House({
  x, y, areaM2, scale, onPointerDown,
}: {
  x: number; y: number; areaM2: number; scale: number;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
}) {
  if (areaM2 <= 0) return null;
  const w = Math.sqrt(areaM2 * 1.5) * scale;
  const h = (areaM2 / Math.sqrt(areaM2 * 1.5)) * scale;
  return (
    <g onPointerDown={onPointerDown} style={{ cursor: 'grab' }}>
      <rect
        x={x} y={y} width={w} height={h} rx={4}
        fill="var(--surface-2)" stroke="var(--text-muted)" strokeWidth="1.5"
      />
      {/* Ridge line, so it reads as a roof rather than a slab. */}
      <line x1={x + w * 0.5} y1={y} x2={x + w * 0.5} y2={y + h}
        stroke="var(--text-muted)" strokeWidth="1" opacity="0.7" />
      {Math.min(w, h) > 46 && (
        <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" className="plot-sub"
          style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          house
        </text>
      )}
    </g>
  );
}

/** A warm wash along the sunny edge. Schematic, not a solar calculation. */
function SunSide({ x, y, w }: { x: number; y: number; w: number }) {
  if (w < 60) return null;
  return (
    <g pointerEvents="none" opacity="0.85">
      <defs>
        <linearGradient id="sun-side" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--status-warning)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--status-warning)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={x} y={y - 30} width={w} height={30} fill="url(#sun-side)" />
      {/* Sits inside the lot at the right edge, clear of the scale bar on the
          left and the add button in the middle. */}
      <g transform={`translate(${x + w - 18},${y - 15})`}>
        <circle r="4.5" fill="var(--status-warning)" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 6.4} y1={Math.sin(a) * 6.4}
              x2={Math.cos(a) * 8.6} y2={Math.sin(a) * 8.6}
              stroke="var(--status-warning)" strokeWidth="1.4" strokeLinecap="round"
            />
          );
        })}
        {w > 300 && (
          <text x="-14" y="4" textAnchor="end" className="plot-sub">sunniest side</text>
        )}
      </g>
    </g>
  );
}

/** Which way is up. Every site plan has one; ours drives the sun figures too. */
function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} opacity="0.75" pointerEvents="none">
      <path d="M0,-13 L5,7 L0,3 L-5,7 Z" fill="var(--text-secondary)" />
      <text y="20" textAnchor="middle" className="plot-sub" style={{ fontWeight: 600 }}>N</text>
    </g>
  );
}

/** A bar you can hold a real tape measure against. */
function ScaleBar({ x, y, scale }: { x: number; y: number; scale: number }) {
  // Pick a round number of metres that lands near 90 px at the current zoom.
  const target = 90 / scale;
  const steps = [1, 2, 5, 10, 20, 50, 100];
  const metres = steps.find((s) => s >= target) ?? 100;
  const w = metres * scale;
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      <line x1="0" x2={w} y1="0" y2="0" stroke="var(--text-secondary)" strokeWidth="2" />
      <line x1="0" x2="0" y1="-4" y2="4" stroke="var(--text-secondary)" strokeWidth="2" />
      <line x1={w / 2} x2={w / 2} y1="-2.5" y2="2.5" stroke="var(--text-secondary)" strokeWidth="1.5" />
      <line x1={w} x2={w} y1="-4" y2="4" stroke="var(--text-secondary)" strokeWidth="2" />
      <text x={w / 2} y="-8" textAnchor="middle" className="plot-sub">{metres} m</text>
    </g>
  );
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, Math.max(1, n - 1))}…`;
}

export function trimNum(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function categoryIconFor(systemId: string): string {
  const def = CATALOG_BY_ID[systemId];
  return def ? CATEGORY_ICON[def.category] : 'info';
}
