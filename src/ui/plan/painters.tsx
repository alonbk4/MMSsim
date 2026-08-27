/**
 * Painting a footprint.
 *
 * The painter receives geometry from `geometry.ts` and draws in metres; the
 * canvas scales the group, so areas stay exact and strokes stay one pixel at
 * every zoom level. Filled shapes with soft depth and a glyph badge — chosen
 * over a drafting look because this is meant to be friendly to read.
 */
import type { ReactNode } from 'react';
import type { SystemCategory, SystemDef } from '../../engine/types';
import { bandCentreline, bandPath, blobPath, hash, mulberry, type PlanFootprint } from './geometry';
import { PlanGlyph } from './glyphs';

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
 * Shared paint. The ripple fill has to be declared once per category: a
 * `<pattern>` resolves CSS custom properties where it is *defined*, not where
 * it is referenced, so a single shared pattern inherits nothing and paints
 * black.
 */
export function PlanDefs() {
  return (
    <defs>
      {CATEGORIES.map((c) => (
        <g key={c} className={`cat-${c}`}>
          <pattern id={`ripple-${c}`} width="1.15" height="0.7" patternUnits="userSpaceOnUse">
            <path d="M0,0.35 q0.29,-0.2 0.575,0 t0.575,0" fill="none"
              stroke="var(--cat-ink)" strokeWidth="0.085" opacity="0.4" />
          </pattern>
        </g>
      ))}

      {/* One soft drop shadow, reused by every mark. */}
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
/*  Illustrated                                                            */
/* ====================================================================== */

export function paintIllustrated({ def, fp, scale, seed }: PaintArgs): ReactNode {
  const s = fp.shape;
  const ink = 'var(--cat-ink)';
  // A yard is mostly food systems, and fifteen identically green rectangles
  // blur together. Each system gets a small fixed step toward its category's
  // lighter tone, so neighbours separate without leaving the palette.
  const step = (hash(def.id) % 5) * 5.5;
  const fill = `color-mix(in oklab, var(--cat-fill) ${100 - step}%, var(--cat-lift))`;
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
          {detail && isWater && <path d={d} fill={`url(#ripple-${def.category})`} />}
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

export { paintIllustrated as paintPlan };
