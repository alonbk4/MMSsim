import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG_BY_ID } from '../engine/catalog';
import type { PlacementReport } from '../engine/simulate';
import type { Placement } from '../engine/types';
import { systemById, useApp, useSimulation } from '../state/store';
import { CATEGORY_ICON, Icon } from './common';
import { MONTHS } from '../engine/climate';
import { collectCasters, shadowsAt } from '../engine/shade';
import { longestDay, MID_MONTH_DAY, shortestDay, sunSummary, sunTrack } from '../engine/solar';
import { hash, planFootprint } from '../engine/footprint';
import { paintPlan, PlanDefs } from './plan/painters';
import { FeatureShape, ShadowLayer, ZoneDefs, ZoneShape } from './plan/site';

export function YardCanvas() {
  const design = useApp((s) => s.design);
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const selected = useApp((s) => s.selectedPlacementId);
  const selectedFeature = useApp((s) => s.selectedFeatureId);
  const selectedZone = useApp((s) => s.selectedZoneId);
  const select = useApp((s) => s.select);
  const selectFeature = useApp((s) => s.selectFeature);
  const selectZone = useApp((s) => s.selectZone);
  const updateFeature = useApp((s) => s.updateFeature);
  const updateZone = useApp((s) => s.updateZone);
  const shadows = useApp((s) => s.shadows);
  const move = useApp((s) => s.movePlacement);
  const update = useApp((s) => s.updatePlacement);
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
    | { kind: 'resize'; id: string; startUnits: number; startDiag: number }
    | { kind: 'moveBox'; id: string; what: 'feature' | 'zone'; dx: number; dy: number }
    | {
        kind: 'resizeBox'; id: string; what: 'feature' | 'zone';
        startW: number; startD: number; startX: number; startY: number;
      }
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

  /** Start a corner drag. Area scales with the square of the diagonal, which
   *  is what makes dragging feel like resizing rather than stretching. */
  const onResizeDown = (e: React.PointerEvent<Element>, p: Placement) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const pt = local(e);
    pointers.current.set(e.pointerId, pt);
    const w = toWorld(pt.x, pt.y);
    const diag = Math.max(0.4, Math.hypot(w.x - p.x, w.y - p.y));
    gesture.current = { kind: 'resize', id: p.id, startUnits: p.units, startDiag: diag };
    setResizing(p.id);
    if (!touched) { setTouched(true); setView({ fitted: true }); }
  };

  const onBoxDown = (
    e: React.PointerEvent<Element>, id: string, what: 'feature' | 'zone',
    box: { x: number; y: number },
  ) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const pt = local(e);
    pointers.current.set(e.pointerId, pt);
    const w = toWorld(pt.x, pt.y);
    gesture.current = { kind: 'moveBox', id, what, dx: w.x - box.x, dy: w.y - box.y };
    if (what === 'feature') selectFeature(id); else selectZone(id);
    if (!touched) { setTouched(true); setView({ fitted: true }); }
  };

  const onBoxResizeDown = (
    e: React.PointerEvent<Element>, id: string, what: 'feature' | 'zone',
    box: { x: number; y: number; w: number; d: number },
  ) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const pt = local(e);
    pointers.current.set(e.pointerId, pt);
    gesture.current = {
      kind: 'resizeBox', id, what,
      startW: box.w, startD: box.d, startX: box.x, startY: box.y,
    };
    if (!touched) { setTouched(true); setView({ fitted: true }); }
  };

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
      select(null);
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
    if (g.kind === 'moveBox') {
      const w = toWorld(pt.x, pt.y);
      const snap = (v: number) => Math.round(v * 2) / 2;
      const patch = { x: snap(w.x - g.dx), y: snap(w.y - g.dy) };
      if (g.what === 'feature') updateFeature(g.id, patch); else updateZone(g.id, patch);
      return;
    }
    if (g.kind === 'resizeBox') {
      const w = toWorld(pt.x, pt.y);
      const snap = (v: number) => Math.max(0.2, Math.round(v * 4) / 4);
      const patch = { w: snap(w.x - g.startX), d: snap(w.y - g.startY) };
      if (g.what === 'feature') updateFeature(g.id, patch); else updateZone(g.id, patch);
      return;
    }
    if (g.kind === 'resize') {
      const w = toWorld(pt.x, pt.y);
      const p = design.placements.find((q) => q.id === g.id);
      const def = p ? systemById(design, p.systemId) : undefined;
      if (!p || !def) return;
      const diag = Math.max(0.4, Math.hypot(w.x - p.x, w.y - p.y));
      const k = diag / g.startDiag;
      const raw = g.startUnits * k * k;
      const stepped = Math.round(raw / def.unitStep) * def.unitStep;
      const units = Math.max(def.unitMin, Math.min(def.unitMax, Number(stepped.toFixed(4))));
      if (units !== p.units) update(g.id, { units });
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
    if (pointers.current.size === 0) {
      gesture.current = { kind: 'none' };
      setResizing(null);
    }
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
  const [resizing, setResizing] = useState<string | null>(null);

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

  // Shadows for the moment the scrubber is parked on. Only computed when the
  // overlay is showing, since it walks every obstruction.
  const shadowShapes = useMemo(() => {
    if (!shadows.on) return [];
    const day = MID_MONTH_DAY[shadows.month];
    const track = sunTrack(site.latitude, day, 49);
    if (track.length === 0) return [];
    // Pick the sample closest to the chosen hour of the day.
    const idx = Math.round(((shadows.hour - 6) / 12) * (track.length - 1));
    const sun = track[Math.max(0, Math.min(track.length - 1, idx))];
    return shadowsAt(collectCasters(design), sun, site.meanTempC[shadows.month] >= 9);
  }, [shadows, design, site.latitude, site.meanTempC]);

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

        {/* North is up, so the sun comes from the bottom of the plan in the
            northern hemisphere and the top in the southern. */}
        <SunSide
          x={X(0)} y={site.latitude < 0 ? Y(0) : Y(lotH)}
          w={lotW * view.scale} flip={site.latitude < 0}
        />

        <ZoneDefs />

        {/* Ground you have marked, under everything else. */}
        {design.zones.map((z) => (
          <g
            key={z.id}
            transform={`translate(${X(z.x).toFixed(2)},${Y(z.y).toFixed(2)}) scale(${view.scale})`}
            onPointerDown={(e) => onBoxDown(e, z.id, 'zone', z)}
            style={{ cursor: 'grab' }}
          >
            <ZoneShape zone={z} selected={selectedZone === z.id} />
          </g>
        ))}

        <House
          x={X(site.houseX)} y={Y(site.houseY)}
          areaM2={site.roofAreaM2} scale={view.scale}
          onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, undefined, true); }}
        />

        {/* Cast shadows sit above the ground and below the planting, so you can
            see what falls across what. */}
        <g transform={`translate(${X(0).toFixed(2)},${Y(0).toFixed(2)}) scale(${view.scale})`}>
          <ShadowLayer shapes={shadowShapes} />
        </g>

        {design.features.map((f) => (
          <g key={f.id}>
            <g
              transform={`translate(${X(f.x).toFixed(2)},${Y(f.y).toFixed(2)}) scale(${view.scale})`}
              onPointerDown={(e) => onBoxDown(e, f.id, 'feature', f)}
              style={{ cursor: 'grab' }}
            >
              <rect width={f.w} height={f.d} fill="transparent" />
              <FeatureShape feature={f} selected={selectedFeature === f.id} />
            </g>
            {Math.min(f.w, f.d) * view.scale > 40 && f.heightM > 0 && (
              <text
                x={X(f.x + f.w / 2)} y={Y(f.y + f.d / 2) + 4} textAnchor="middle"
                className="plot-sub" pointerEvents="none"
              >
                {trimNum(f.heightM)} m
              </text>
            )}
          </g>
        ))}

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

              {isSel && (
                <g
                  onPointerDown={(e) => onResizeDown(e, p)}
                  style={{ cursor: 'nwse-resize' }}
                >
                  {/* Generous invisible target — the visible dot is too small
                      for a fingertip. */}
                  <circle cx={px + wPx} cy={py + hPx} r="16" fill="transparent" />
                  <circle
                    cx={px + wPx} cy={py + hPx} r="7"
                    fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="2"
                  />
                  <path
                    d={`M${px + wPx - 2.6},${py + hPx + 2.6} L${px + wPx + 2.6},${py + hPx - 2.6}`}
                    stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"
                  />
                </g>
              )}

              {resizing === p.id && (
                <g pointerEvents="none">
                  <rect
                    x={px + wPx - 46} y={py + hPx + 14} width={92} height={24} rx={12}
                    fill="var(--surface-1)" stroke="var(--border)" strokeWidth="1"
                  />
                  <text
                    x={px + wPx} y={py + hPx + 30} textAnchor="middle"
                    className="plot-label" style={{ fontWeight: 600 }}
                  >
                    {trimNum(p.units)} {def.unitLabel}
                  </text>
                </g>
              )}
              {fp.onRoof && short > 96 && (
                <text x={px + wPx / 2} y={py + hPx - 6} textAnchor="middle" className="plot-sub">
                  on the roof
                </text>
              )}
            </g>
          );
        })}

        {/* Top-left is the only corner neither the inspector sheet (right on
            desktop, bottom on a phone) nor the add button ever covers. */}
        {[
          ...design.features.map((f) => ({ id: f.id, what: 'feature' as const, box: f, d: f.d })),
          ...design.zones.map((z) => ({ id: z.id, what: 'zone' as const, box: z, d: z.d })),
        ]
          .filter((it) => it.id === selectedFeature || it.id === selectedZone)
          .map((it) => {
            const bx = X(it.box.x), by = Y(it.box.y);
            const bw = it.box.w * view.scale, bh = it.d * view.scale;
            return (
              <g key={it.id}>
                <rect
                  x={bx - 4} y={by - 4} width={bw + 8} height={bh + 8} rx={8}
                  fill="none" stroke="var(--text-primary)" strokeWidth="1.5"
                  strokeDasharray="4 3" opacity="0.55" pointerEvents="none"
                />
                <g
                  onPointerDown={(e) => onBoxResizeDown(e, it.id, it.what, { ...it.box, d: it.d })}
                  style={{ cursor: 'nwse-resize' }}
                >
                  <circle cx={bx + bw} cy={by + bh} r="16" fill="transparent" />
                  <circle
                    cx={bx + bw} cy={by + bh} r="7"
                    fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="2"
                  />
                  <path
                    d={`M${bx + bw - 2.6},${by + bh + 2.6} L${bx + bw + 2.6},${by + bh - 2.6}`}
                    stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"
                  />
                </g>
              </g>
            );
          })}

        <SunRose x={52} y={size.h > 380 ? 168 : 120} latitude={site.latitude} />
        <ScaleBar x={14} y={size.h - 18} scale={view.scale} />
      </svg>

      <ShadowScrubber />

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

/**
 * Park the sun at a month and an hour and watch what falls where. Winter
 * mid-afternoon is the default, because that is when a yard's shade problems
 * are worst and least obvious from a summer walk round.
 */
function ShadowScrubber() {
  const shadows = useApp((s) => s.shadows);
  const setShadows = useApp((s) => s.setShadows);
  const latitude = useApp((s) => s.design.site.latitude);
  const daylight = sunSummary(latitude);

  return (
    <div className={`shadow-scrubber${shadows.on ? ' open' : ''}`}>
      <button
        className="chip" aria-pressed={shadows.on}
        onClick={() => setShadows({ on: !shadows.on })}
      >
        {shadows.on ? 'Hide shadows' : 'Show shadows'}
      </button>
      {shadows.on && (
        <>
          <label>
            <span>{MONTHS[shadows.month]}</span>
            <input
              type="range" min={0} max={11} step={1} value={shadows.month}
              onChange={(e) => setShadows({ month: Number(e.target.value) })}
              aria-label="Month"
            />
          </label>
          <label>
            <span>{formatHour(shadows.hour)}</span>
            <input
              type="range" min={6} max={18} step={0.5} value={shadows.hour}
              onChange={(e) => setShadows({ hour: Number(e.target.value) })}
              aria-label="Time of day"
            />
          </label>
          <span className="meta-line">
            {daylight.winterDayLength.toFixed(1)}–{daylight.summerDayLength.toFixed(1)} h of
            daylight across the year
          </span>
        </>
      )}
    </div>
  );
}

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = h % 1 >= 0.5 ? '30' : '00';
  return `${hh}:${mm}`;
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

/** A warm wash along whichever edge the midday sun comes from. */
function SunSide({ x, y, w, flip }: { x: number; y: number; w: number; flip: boolean }) {
  if (w < 60) return null;
  const h = 30;
  return (
    <g pointerEvents="none" opacity="0.85">
      <defs>
        <linearGradient id="sun-side" x1="0" y1={flip ? '0' : '1'} x2="0" y2={flip ? '1' : '0'}>
          <stop offset="0%" stopColor="var(--status-warning)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--status-warning)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={x} y={flip ? y : y - h} width={w} height={h} fill="url(#sun-side)" />
      {w > 300 && (
        <text
          x={x + w - 12} y={flip ? y + 19 : y - 11} textAnchor="end" className="plot-sub"
        >
          sunniest side
        </text>
      )}
    </g>
  );
}

/**
 * A sun-path rose: where the sun rises, how high it climbs and where it sets,
 * on the longest and shortest days at this latitude.
 *
 * Drawn as the standard polar projection — the centre is straight overhead,
 * the outer circle is the horizon — so a tight arc means a high sun and a wide
 * one means a low winter sun raking across the yard. Screen-anchored rather
 * than laid over the plan, where the arcs would tangle with the planting.
 */
function SunRose({ x, y, latitude }: { x: number; y: number; latitude: number }) {
  const R = 30;
  const project = (az: number, alt: number) => {
    const r = (R * (90 - Math.max(0, alt))) / 90;
    return [Math.sin(az * (Math.PI / 180)) * r, -Math.cos(az * (Math.PI / 180)) * r];
  };
  const pathFor = (day: number) => {
    const track = sunTrack(latitude, day, 33);
    if (track.length === 0) return '';
    return track
      .map((p, i) => {
        const [px, py] = project(p.azimuth, p.altitude);
        return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
      })
      .join(' ');
  };
  const summer = pathFor(longestDay(latitude));
  const winter = pathFor(shortestDay(latitude));
  const sun = sunSummary(latitude);
  const [nx, ny] = project(latitude >= 0 ? 180 : 0, sun.summerNoon);

  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      <title>
        {`Sun path at ${Math.abs(latitude).toFixed(0)}° ${latitude < 0 ? 'S' : 'N'}: `
          + `${Math.round(sun.summerNoon)}° high on the longest day, `
          + `${Math.round(Math.max(0, sun.winterNoon))}° on the shortest.`}
      </title>
      <circle r={R} fill="var(--surface-1)" fillOpacity="0.7"
        stroke="var(--border)" strokeWidth="1" />
      <line x1={-R} x2={R} y1="0" y2="0" stroke="var(--gridline)" strokeWidth="1" />
      <line x1="0" x2="0" y1={-R} y2={R} stroke="var(--gridline)" strokeWidth="1" />
      {winter && (
        <path d={winter} fill="none" stroke="var(--text-secondary)" strokeWidth="1.9" strokeLinecap="round" />
      )}
      {summer && (
        <path d={summer} fill="none" stroke="var(--status-warning)" strokeWidth="2" strokeLinecap="round" />
      )}
      {summer && <circle cx={nx} cy={ny} r="3" fill="var(--status-warning)" />}
      <path d={`M0,${-R - 4} l3.4,7 l-3.4,-2.4 l-3.4,2.4 Z`} fill="var(--text-secondary)" />
      <text y={-R - 8} textAnchor="middle" className="plot-sub" style={{ fontWeight: 600 }}>N</text>
      <text y={R + 15} textAnchor="middle" className="plot-sub">sun path</text>
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
