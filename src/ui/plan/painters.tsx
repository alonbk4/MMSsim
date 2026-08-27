/**
 * Two ways to paint the same footprint.
 *
 * Both painters receive identical geometry from `geometry.ts` and draw in
 * metres; the canvas scales the group, so areas stay exact and strokes stay
 * one pixel at every zoom level.
 *
 * - `sitePlan`    reads like a drawing you would hand a builder: paper fills,
 *                 hairlines, hatching, contour ticks.
 * - `illustrated` reads like a consumer app: filled shapes, soft depth, a
 *                 glyph badge, more colour.
 */
import type { ReactNode } from 'react';
import type { SystemCategory, SystemDef } from '../../engine/types';
import { bandCentreline, bandPath, blobPath, mulberry, type PlanFootprint } from './geometry';
import { PlanGlyph } from './glyphs';

export type PlanStyleId = 'sitePlan' | 'illustrated';

export interface PaintArgs {
  def: SystemDef;
  fp: PlanFootprint;
  selected: boolean;
  starved: boolean;
  /** Pixels per metre — lets a painter drop detail when it would turn to mud. */
  scale: number;
  seed: number;
}

/** Hairlines that ignore the group's scale transform. */
const HAIR = { vectorEffect: 'non-scaling-stroke' as const };

/* ====================================================================== */
/*  Shared defs                                                            */
/* ====================================================================== */

const CATEGORIES: SystemCategory[] = ['water', 'food', 'energy', 'sanitation', 'soil', 'shelter'];

/**
 * Pattern fills have to be declared once per category.
 *
 * A `<pattern>` resolves CSS custom properties where it is *defined*, not
 * where it is referenced, so a single shared pattern reading `var(--cat-ink)`
 * inherits nothing and paints black. Wrapping each set in its own `.cat-*`
 * group is what makes hatching take the colour of the system using it.
 */
export function PlanDefs() {
  return (
    <defs>
      {CATEGORIES.map((c) => (
        <g key={c} className={`cat-${c}`}>
          <pattern id={`hatch-45-${c}`} width="0.62" height="0.62"
            patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="0.62" stroke="var(--cat-ink)" strokeWidth="0.1" opacity="0.55" />
          </pattern>
          <pattern id={`hatch-canopy-${c}`} width="0.5" height="0.5"
            patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1="0" y1="0" x2="0" y2="0.5" stroke="var(--cat-ink)" strokeWidth="0.085" opacity="0.5" />
          </pattern>
          <pattern id={`hatch-water-${c}`} width="1.1" height="0.62" patternUnits="userSpaceOnUse">
            <path d="M0,0.31 q0.275,-0.18 0.55,0 t0.55,0" fill="none"
              stroke="var(--cat-ink)" strokeWidth="0.09" opacity="0.7" />
          </pattern>
          <pattern id={`hatch-gravel-${c}`} width="0.58" height="0.58" patternUnits="userSpaceOnUse">
            <circle cx="0.14" cy="0.17" r="0.07" fill="var(--cat-ink)" opacity="0.5" />
            <circle cx="0.42" cy="0.43" r="0.055" fill="var(--cat-ink)" opacity="0.4" />
          </pattern>
        </g>
      ))}

      {/* Illustrated depth: one soft drop shadow, reused by every mark. */}
      <filter id="ill-shadow" x="-30%" y="-30%" width="170%" height="170%">
        <feDropShadow dx="0" dy="0.12" stdDeviation="0.14" floodOpacity="0.28" />
      </filter>
      <linearGradient id="ill-sheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="60%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/* ====================================================================== */
/*  Site plan                                                              */
/* ====================================================================== */

export function paintSitePlan({ def, fp, scale, seed }: PaintArgs): ReactNode {
  const s = fp.shape;
  const ink = 'var(--cat-ink)';
  const paper = 'var(--surface-1)';
  const detail = scale > 7;

  switch (s.kind) {
    case 'block':
      return (
        <>
          <rect width={s.w} height={s.h} fill={paper} fillOpacity="0.75" stroke={ink} strokeWidth="1.2" style={HAIR} />
          <rect width={s.w} height={s.h} fill={`url(#hatch-45-${def.category})`} />
          {detail && s.rows > 0 && Array.from({ length: s.rows - 1 }, (_, i) => (
            <line
              key={i} x1={0} x2={s.w}
              y1={((i + 1) * s.h) / s.rows} y2={((i + 1) * s.h) / s.rows}
              stroke={ink} strokeWidth="0.8" opacity="0.45" style={HAIR}
            />
          ))}
          <PlanGlyph def={def} w={s.w} h={s.h} tone={ink} hidden={!detail} scale={scale} />
        </>
      );

    case 'roof':
      return (
        <>
          <rect width={s.w} height={s.h} fill={paper} fillOpacity="0.7" stroke={ink}
            strokeWidth="1.2" strokeDasharray="5 3" style={HAIR} />
          {detail && s.grid === 'panels' && <PanelGrid w={s.w} h={s.h} stroke={ink} />}
          {detail && s.grid === 'sheets' && (
            <>
              {Array.from({ length: 4 }, (_, i) => (
                <line key={i} x1={((i + 1) * s.w) / 5} x2={((i + 1) * s.w) / 5} y1={0} y2={s.h}
                  stroke={ink} strokeWidth="0.7" opacity="0.4" style={HAIR} />
              ))}
              {/* Ridge line and fall arrows: which way the water actually goes. */}
              <line x1={0} y1={s.h / 2} x2={s.w} y2={s.h / 2} stroke={ink} strokeWidth="1.4" opacity="0.7" style={HAIR} />
            </>
          )}
          <PlanGlyph def={def} w={s.w} h={s.h} tone={ink} hidden={!detail} scale={scale} />
        </>
      );

    case 'disc':
      return (
        <>
          <circle cx={s.r} cy={s.r} r={s.r} fill={paper} fillOpacity="0.8" stroke={ink} strokeWidth="1.4" style={HAIR} />
          {detail && <circle cx={s.r} cy={s.r} r={s.r * 0.72} fill="none" stroke={ink} strokeWidth="0.8" opacity="0.5" style={HAIR} />}
          <PlanGlyph def={def} w={s.w} h={s.h} tone={ink} hidden={!detail} scale={scale} />
        </>
      );

    case 'blob': {
      const d = blobPath(s.w, s.h, seed);
      const isWater = def.category === 'water' || def.id === 'water-pond' || def.id === 'duckweed-pond';
      return (
        <>
          <path d={d} fill={paper} fillOpacity="0.7" stroke={ink} strokeWidth="1.4" style={HAIR} />
          <path d={d} fill={`url(#hatch-${isWater ? 'water' : 'canopy'}-${def.category})`} />
        </>
      );
    }

    case 'band': {
      const d = bandPath(s.w, s.thickness, seed);
      const c = bandCentreline(s.w, s.thickness, seed);
      return (
        <>
          <path d={d} fill={paper} fillOpacity="0.65" stroke={ink} strokeWidth="1.2" style={HAIR} />
          {/* Ticks along the centre line — the surveyor's mark for a contour. */}
          {detail && <path d={c} fill="none" stroke={ink} strokeWidth="1" strokeDasharray="3 3" opacity="0.75" style={HAIR} />}
        </>
      );
    }

    case 'cells':
      return (
        <>
          <rect width={s.w} height={s.h} fill={paper} fillOpacity="0.8" stroke={ink} strokeWidth="1.3" style={HAIR} />
          {Array.from({ length: s.count - 1 }, (_, i) => (
            <line key={i} x1={((i + 1) * s.w) / s.count} x2={((i + 1) * s.w) / s.count} y1={0} y2={s.h}
              stroke={ink} strokeWidth="1.1" style={HAIR} />
          ))}
          {detail && <rect width={s.w} height={s.h} fill={`url(#hatch-gravel-${def.category})`} />}
        </>
      );

    case 'enclosure':
      return (
        <>
          <rect width={s.w} height={s.h} fill={paper} fillOpacity="0.6" stroke={ink}
            strokeWidth="1.2" strokeDasharray="2 2.5" style={HAIR} />
          <rect x={s.w - s.hut - 0.15} y={0.15} width={s.hut} height={s.hut}
            fill={ink} fillOpacity="0.25" stroke={ink} strokeWidth="1.2" style={HAIR} />
          {detail && <rect width={s.w} height={s.h} fill={`url(#hatch-gravel-${def.category})`} opacity="0.75" />}
          <PlanGlyph def={def} w={s.w - s.hut} h={s.h} tone={ink} hidden={!detail} scale={scale} />
        </>
      );

    case 'cluster':
      return (
        <>
          {s.items.map((it, i) => (
            <g key={i}>
              <circle cx={it.x} cy={it.y} r={it.r} fill={`url(#hatch-canopy-${def.category})`} stroke={ink} strokeWidth="1.1" style={HAIR} />
              {detail && (
                <>
                  <line x1={it.x - it.r * 0.2} x2={it.x + it.r * 0.2} y1={it.y} y2={it.y} stroke={ink} strokeWidth="1" style={HAIR} />
                  <line x1={it.x} x2={it.x} y1={it.y - it.r * 0.2} y2={it.y + it.r * 0.2} stroke={ink} strokeWidth="1" style={HAIR} />
                </>
              )}
            </g>
          ))}
        </>
      );
  }
}

/* ====================================================================== */
/*  Illustrated                                                            */
/* ====================================================================== */

export function paintIllustrated({ def, fp, scale, seed }: PaintArgs): ReactNode {
  const s = fp.shape;
  const ink = 'var(--cat-ink)';
  const fill = 'var(--cat-fill)';
  const lift = 'var(--cat-lift)';
  const detail = scale > 7;
  const r = (v: number) => Math.min(0.45, v * 0.16);

  switch (s.kind) {
    case 'block':
      return (
        <g filter="url(#ill-shadow)">
          <rect width={s.w} height={s.h} rx={r(Math.min(s.w, s.h))} fill={fill} stroke={ink} strokeWidth="1.6" style={HAIR} />
          {detail && s.rows > 0 && Array.from({ length: s.rows }, (_, i) => (
            <rect
              key={i} x={s.w * 0.06} width={s.w * 0.88}
              y={(i + 0.22) * (s.h / s.rows)} height={(s.h / s.rows) * 0.42}
              rx={(s.h / s.rows) * 0.2} fill={ink} opacity="0.28"
            />
          ))}
          <rect width={s.w} height={s.h * 0.5} rx={r(Math.min(s.w, s.h))} fill="url(#ill-sheen)" />
          <PlanGlyph def={def} w={s.w} h={s.h} tone={ink} hidden={!detail} badge scale={scale} />
        </g>
      );

    case 'roof':
      return (
        <g filter="url(#ill-shadow)">
          <rect width={s.w} height={s.h} rx={r(Math.min(s.w, s.h))} fill={lift} stroke={ink} strokeWidth="1.6" style={HAIR} />
          {detail && s.grid === 'panels' && <PanelTiles w={s.w} h={s.h} fill={ink} />}
          {detail && s.grid === 'sheets' && Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={(i * s.w) / 5 + s.w * 0.012} y={s.h * 0.08}
              width={s.w / 5 - s.w * 0.024} height={s.h * 0.84}
              rx={s.w * 0.01} fill={ink} opacity="0.14" />
          ))}
          <PlanGlyph def={def} w={s.w} h={s.h} tone={ink} hidden={!detail} badge scale={scale} />
        </g>
      );

    case 'disc':
      return (
        <g filter="url(#ill-shadow)">
          <circle cx={s.r} cy={s.r} r={s.r} fill={fill} stroke={ink} strokeWidth="1.6" style={HAIR} />
          {detail && <circle cx={s.r} cy={s.r} r={s.r * 0.66} fill={lift} opacity="0.7" />}
          <path d={`M0,${s.r} a${s.r},${s.r} 0 0 1 ${s.r * 2},0 Z`} fill="url(#ill-sheen)" />
          <PlanGlyph def={def} w={s.w} h={s.h} tone={ink} hidden={!detail} badge scale={scale} />
        </g>
      );

    case 'blob': {
      const d = blobPath(s.w, s.h, seed);
      const inner = blobPath(s.w * 0.7, s.h * 0.66, seed + 7);
      const isWater = def.category === 'water' || def.id === 'water-pond' || def.id === 'duckweed-pond';
      return (
        <g filter="url(#ill-shadow)">
          <path d={d} fill={fill} stroke={ink} strokeWidth="1.6" style={HAIR} />
          {detail && (
            <g transform={`translate(${s.w * 0.15},${s.h * 0.17})`}>
              <path d={inner} fill={lift} opacity={isWater ? 0.85 : 0.5} />
            </g>
          )}
          {detail && !isWater && <CanopyDots w={s.w} h={s.h} seed={seed} fill={ink} />}
        </g>
      );
    }

    case 'band': {
      const d = bandPath(s.w, s.thickness, seed);
      return (
        <g filter="url(#ill-shadow)">
          <path d={d} fill={fill} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" style={HAIR} />
          {detail && (
            <path d={bandCentreline(s.w, s.thickness, seed)} fill="none"
              stroke={lift} strokeWidth={s.thickness * 0.3} strokeLinecap="round" opacity="0.8" />
          )}
        </g>
      );
    }

    case 'cells':
      return (
        <g filter="url(#ill-shadow)">
          {Array.from({ length: s.count }, (_, i) => (
            <rect key={i} x={(i * s.w) / s.count + s.w * 0.008} y={0}
              width={s.w / s.count - s.w * 0.016} height={s.h}
              rx={r(Math.min(s.w / s.count, s.h))}
              fill={i % 2 ? lift : fill} stroke={ink} strokeWidth="1.5" style={HAIR} />
          ))}
          <PlanGlyph def={def} w={s.w} h={s.h} tone={ink} hidden={!detail} badge scale={scale} />
        </g>
      );

    case 'enclosure':
      return (
        <g filter="url(#ill-shadow)">
          <rect width={s.w} height={s.h} rx={r(Math.min(s.w, s.h))} fill={fill} stroke={ink}
            strokeWidth="1.6" strokeDasharray="3 2" style={HAIR} />
          <rect x={s.w - s.hut - 0.2} y={0.2} width={s.hut} height={s.hut}
            rx={s.hut * 0.18} fill={ink} opacity="0.75" />
          <PlanGlyph def={def} w={s.w - s.hut} h={s.h} tone={ink} hidden={!detail} badge scale={scale} />
        </g>
      );

    case 'cluster':
      return (
        <>
          {s.items.map((it, i) => (
            <g key={i} filter="url(#ill-shadow)">
              <circle cx={it.x} cy={it.y} r={it.r} fill={fill} stroke={ink} strokeWidth="1.4" style={HAIR} />
              {detail && <circle cx={it.x - it.r * 0.22} cy={it.y - it.r * 0.24} r={it.r * 0.46} fill={lift} opacity="0.85" />}
            </g>
          ))}
        </>
      );
  }
}

/* ====================================================================== */
/*  Small shared pieces                                                    */
/* ====================================================================== */

function PanelGrid({ w, h, stroke }: { w: number; h: number; stroke: string }) {
  const cols = Math.max(2, Math.round(w / 1.7));
  const rows = Math.max(1, Math.round(h / 1.1));
  return (
    <g stroke={stroke} strokeWidth="0.7" opacity="0.55" style={HAIR}>
      {Array.from({ length: cols - 1 }, (_, i) => (
        <line key={`c${i}`} x1={((i + 1) * w) / cols} x2={((i + 1) * w) / cols} y1={0} y2={h} />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <line key={`r${i}`} x1={0} x2={w} y1={((i + 1) * h) / rows} y2={((i + 1) * h) / rows} />
      ))}
    </g>
  );
}

function PanelTiles({ w, h, fill }: { w: number; h: number; fill: string }) {
  const cols = Math.max(2, Math.round(w / 1.7));
  const rows = Math.max(1, Math.round(h / 1.1));
  const gap = Math.min(w, h) * 0.03;
  const tiles: ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    for (let rw = 0; rw < rows; rw++) {
      tiles.push(
        <rect
          key={`${c}-${rw}`}
          x={(c * w) / cols + gap} y={(rw * h) / rows + gap}
          width={w / cols - gap * 2} height={h / rows - gap * 2}
          rx={gap} fill={fill} opacity="0.5"
        />,
      );
    }
  }
  return <>{tiles}</>;
}

function CanopyDots({ w, h, seed, fill }: { w: number; h: number; seed: number; fill: string }) {
  const rnd = mulberry(seed + 3);
  const n = Math.min(9, Math.max(3, Math.round((w * h) / 12)));
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx={w * (0.18 + rnd() * 0.64)}
          cy={h * (0.18 + rnd() * 0.64)}
          r={Math.min(w, h) * 0.055}
          fill={fill}
          opacity="0.35"
        />
      ))}
    </>
  );
}

export const PAINTERS: Record<PlanStyleId, (a: PaintArgs) => ReactNode> = {
  sitePlan: paintSitePlan,
  illustrated: paintIllustrated,
};

export const STYLE_LABEL: Record<PlanStyleId, string> = {
  sitePlan: 'Site plan',
  illustrated: 'Illustrated',
};
