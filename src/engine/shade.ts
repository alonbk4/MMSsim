/**
 * What actually falls on a plot, once the things already on site are in the way.
 *
 * The sun model in `solar.ts` says where the sun is. This says whether you can
 * see it from a particular square metre of ground — which is the one thing no
 * climate preset can ever know for you, and usually the difference between a
 * bed that works and one that sulks.
 *
 * The method is ordinary shadow geometry. An obstruction of height H, with the
 * sun at altitude α, throws a shadow H / tan(α) long directly away from the
 * sun's azimuth. Sample a plot at a few points, sample the day at a few times,
 * ask at each whether anything is in the way, and weight the answers by how
 * much energy that moment of the day was worth.
 */
import { CATALOG_BY_ID } from './catalog';
import { MONTHS } from './climate';
import { planFootprint } from './footprint';
import { MID_MONTH_DAY, sunTrack, type SunPoint } from './solar';
import type { Design, Foliage, Placement, SystemDef } from './types';

/** Below this the sun is weak and shadows run to the horizon; not worth modelling. */
const MIN_ALTITUDE = 4;
/** Shadows longer than this are somebody else's problem. */
const MAX_SHADOW_M = 80;

export interface Caster {
  id: string;
  /** Circles are trees and canopies; boxes are everything built. */
  shape: 'box' | 'circle';
  x: number;
  y: number;
  w: number;
  d: number;
  heightM: number;
  foliage: Foliage;
  label: string;
}

/** How much light each kind of obstruction stops when it is in the way. */
function opacity(foliage: Foliage, inLeaf: boolean): number {
  if (foliage === 'solid') return 0.95;
  if (foliage === 'evergreen') return 0.85;
  return inLeaf ? 0.8 : 0.3;
}

/**
 * Tall perennials you have *planted* shade their neighbours too — a mature
 * fruit tree does not care that you filed it under food. Only systems with a
 * real canopy are listed; a bed does not shade the bed beside it.
 */
const SYSTEM_HEIGHT_M: Record<string, number> = {
  'fruit-trees': 4.5,
  'food-forest': 5,
  'coppice-woodlot': 4,
  'berry-hedge': 1.6,
  'attached-greenhouse': 2.6,
  'polytunnel': 2.4,
  'shade-structure': 2.4,
  'thermal-mass-wall': 2.6,
};

const CIRCULAR = new Set(['fruit-trees', 'food-forest', 'coppice-woodlot']);

/** Everything on the plan that can put a plot in shadow. */
export function collectCasters(design: Design): Caster[] {
  const out: Caster[] = [];
  const site = design.site;

  if (site.roofAreaM2 > 0 && site.houseHeightM > 0) {
    const w = Math.sqrt(site.roofAreaM2 * 1.5);
    out.push({
      id: 'house', shape: 'box', label: 'the house',
      x: site.houseX, y: site.houseY, w, d: site.roofAreaM2 / w,
      heightM: site.houseHeightM, foliage: 'solid',
    });
  }

  for (const f of design.features) {
    if (f.heightM <= 0.15) continue;
    out.push({
      id: f.id, shape: f.kind === 'tree' ? 'circle' : 'box',
      label: f.label || f.kind,
      x: f.x, y: f.y, w: f.w, d: f.d,
      heightM: f.heightM, foliage: f.foliage,
    });
  }

  for (const p of design.placements) {
    if (!p.enabled) continue;
    const h = SYSTEM_HEIGHT_M[p.systemId];
    if (!h) continue;
    const def = CATALOG_BY_ID[p.systemId];
    if (!def) continue;
    const fp = planFootprint(def, p);
    out.push({
      id: p.id, shape: CIRCULAR.has(p.systemId) ? 'circle' : 'box',
      label: p.label || def.name,
      x: p.x, y: p.y, w: fp.w, d: fp.h,
      heightM: h,
      foliage: p.systemId === 'coppice-woodlot' || p.systemId === 'berry-hedge'
        ? 'deciduous' : p.systemId === 'food-forest' ? 'deciduous' : 'solid',
    });
  }

  return out;
}

export interface ShadowShape {
  casterId: string;
  /** Convex outline of the shadow on the ground, metres. */
  points: [number, number][];
  /** Circle shadows are a capsule: a segment with a radius. */
  capsule?: { x1: number; y1: number; x2: number; y2: number; r: number };
  opacity: number;
}

/** Unit vector pointing away from the sun, in plan coordinates (north is −y). */
function shadowDirection(azimuthDeg: number): [number, number] {
  const a = azimuthDeg * (Math.PI / 180);
  // The sun lies at (sin az, −cos az); the shadow runs the other way.
  return [-Math.sin(a), Math.cos(a)];
}

function shadowLength(heightM: number, altitudeDeg: number): number {
  const t = Math.tan(altitudeDeg * (Math.PI / 180));
  if (t <= 0) return MAX_SHADOW_M;
  return Math.min(MAX_SHADOW_M, heightM / t);
}

/**
 * The shadows cast at one moment, ready to draw or to test against.
 *
 * `observerHeight` is how far off the ground the thing being shaded sits. It
 * matters more than it sounds: panels on a roof are not shaded by the house
 * they are bolted to, and a boundary fence shades a bed but never a roof. Only
 * the height a caster has *over* the observer casts anything.
 */
export function shadowsAt(
  casters: Caster[], sun: SunPoint, inLeaf: boolean, observerHeight = 0,
): ShadowShape[] {
  if (sun.altitude < MIN_ALTITUDE) return [];
  const [dx, dy] = shadowDirection(sun.azimuth);
  const out: ShadowShape[] = [];

  for (const c of casters) {
    const effective = c.heightM - observerHeight;
    if (effective <= 0.05) continue;
    const L = shadowLength(effective, sun.altitude);
    const ox = dx * L, oy = dy * L;
    const op = opacity(c.foliage, inLeaf);

    if (c.shape === 'circle') {
      const r = Math.min(c.w, c.d) / 2;
      const cx = c.x + c.w / 2, cy = c.y + c.d / 2;
      out.push({
        casterId: c.id,
        capsule: { x1: cx, y1: cy, x2: cx + ox, y2: cy + oy, r },
        points: capsuleOutline(cx, cy, cx + ox, cy + oy, r),
        opacity: op,
      });
    } else {
      const base: [number, number][] = [
        [c.x, c.y], [c.x + c.w, c.y], [c.x + c.w, c.y + c.d], [c.x, c.y + c.d],
      ];
      const moved = base.map(([x, y]) => [x + ox, y + oy] as [number, number]);
      out.push({ casterId: c.id, points: convexHull([...base, ...moved]), opacity: op });
    }
  }
  return out;
}

/* ---------------------------------------------------------------- */
/*  Geometry helpers                                                 */
/* ---------------------------------------------------------------- */

function convexHull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (src: [number, number][]) => {
    const h: [number, number][] = [];
    for (const q of src) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...build(p), ...build([...p].reverse())];
}

function capsuleOutline(x1: number, y1: number, x2: number, y2: number, r: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * r, ny = (dx / len) * r;
  return [
    [x1 + nx, y1 + ny], [x2 + nx, y2 + ny],
    [x2 - nx, y2 - ny], [x1 - nx, y1 - ny],
  ] as [number, number][];
}

function pointInPolygon(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointNearSegment(
  px: number, py: number, x1: number, y1: number, x2: number, y2: number, r: number,
): boolean {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

interface Blocker {
  aabb: [number, number, number, number];
  shape: ShadowShape;
}

function toBlockers(shapes: ShadowShape[]): Blocker[] {
  return shapes.map((shape) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of shape.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    if (shape.capsule) {
      minX -= shape.capsule.r; minY -= shape.capsule.r;
      maxX += shape.capsule.r; maxY += shape.capsule.r;
    }
    return { aabb: [minX, minY, maxX, maxY], shape };
  });
}

/** Fraction of light reaching a point, 0 (fully blocked) to 1 (open sky). */
function transmittance(px: number, py: number, blockers: Blocker[], skipId?: string): number {
  let t = 1;
  for (const b of blockers) {
    if (b.shape.casterId === skipId) continue;
    const [minX, minY, maxX, maxY] = b.aabb;
    if (px < minX || px > maxX || py < minY || py > maxY) continue;
    const hit = b.shape.capsule
      ? pointNearSegment(px, py, b.shape.capsule.x1, b.shape.capsule.y1,
        b.shape.capsule.x2, b.shape.capsule.y2, b.shape.capsule.r)
      : pointInPolygon(px, py, b.shape.points);
    if (hit) t *= 1 - b.shape.opacity;
  }
  return t;
}

/* ---------------------------------------------------------------- */
/*  Exposure                                                         */
/* ---------------------------------------------------------------- */

export interface ExposureReport {
  /** Twelve values, 0..1: the share of available sunlight the plot receives. */
  monthly: number[];
  /** Weighted across the year. */
  annual: number;
  /** Which obstruction costs this plot the most light, if any. */
  worstCaster?: { id: string; label: string; lost: number };
}

/** Sample points across a footprint: centre plus the quarter points. */
function samplePoints(x: number, y: number, w: number, h: number): [number, number][] {
  return [
    [x + w / 2, y + h / 2],
    [x + w * 0.25, y + h * 0.25],
    [x + w * 0.75, y + h * 0.25],
    [x + w * 0.25, y + h * 0.75],
    [x + w * 0.75, y + h * 0.75],
  ];
}

/** Times of day to test, as points on the sun's track for that month. */
function daySamples(latitude: number, day: number): SunPoint[] {
  return sunTrack(latitude, day, 13).filter((p) => p.altitude >= MIN_ALTITUDE);
}

/**
 * Sun exposure for every placement, month by month.
 *
 * Each moment of the day is weighted by the sine of the sun's altitude, which
 * is what an unshaded horizontal surface would actually collect — so an hour
 * lost at noon costs far more than an hour lost at dawn.
 */
export function sunExposure(design: Design): Record<string, ExposureReport> {
  const casters = collectCasters(design);
  const out: Record<string, ExposureReport> = {};
  const site = design.site;

  const boxes = design.placements
    .filter((p) => p.enabled)
    .map((p) => {
      const def = CATALOG_BY_ID[p.systemId]
        ?? design.customSystems.find((s) => s.id === p.systemId);
      if (!def) return null;
      const fp = planFootprint(def, p);
      return { p, def, fp };
    })
    .filter(Boolean) as { p: Placement; def: SystemDef; fp: ReturnType<typeof planFootprint> }[];

  if (boxes.length === 0) return out;

  // Nothing casts a shadow: every plot sees the whole sky.
  if (casters.length === 0) {
    for (const { p } of boxes) {
      out[p.id] = { monthly: new Array(12).fill(1), annual: 1 };
    }
    return out;
  }

  const totals: Record<string, { num: number[]; den: number[] }> = {};
  const blame: Record<string, Record<string, number>> = {};
  for (const { p } of boxes) {
    totals[p.id] = { num: new Array(12).fill(0), den: new Array(12).fill(0) };
    blame[p.id] = {};
  }

  // Plots at the same height see the same shadows, so shadows are built once
  // per height rather than once per plot. In practice there are two: the
  // ground, and the roof.
  const heightOf = (onRoof: boolean) => (onRoof ? site.houseHeightM : 0);
  const groups = new Map<number, typeof boxes>();
  for (const b of boxes) {
    const h = heightOf(b.fp.onRoof);
    const g = groups.get(h);
    if (g) g.push(b); else groups.set(h, [b]);
  }

  for (let m = 0; m < 12; m++) {
    const inLeaf = site.meanTempC[m] >= 9;
    const suns = daySamples(site.latitude, MID_MONTH_DAY[m]);
    for (const sun of suns) {
      const weight = Math.sin(sun.altitude * (Math.PI / 180));
      for (const [observerHeight, group] of groups) {
      const blockers = toBlockers(shadowsAt(casters, sun, inLeaf, observerHeight));
      for (const { p, fp } of group) {
        const pts = samplePoints(p.x, p.y, fp.w, fp.h);
        let lit = 0;
        for (const [px, py] of pts) lit += transmittance(px, py, blockers, p.id);
        const frac = lit / pts.length;
        totals[p.id].num[m] += frac * weight;
        totals[p.id].den[m] += weight;

        // Attribute the loss, so the app can name the culprit.
        if (frac < 0.999) {
          for (const b of blockers) {
            if (b.shape.casterId === p.id) continue;
            const [minX, minY, maxX, maxY] = b.aabb;
            let hits = 0;
            for (const [px, py] of pts) {
              if (px < minX || px > maxX || py < minY || py > maxY) continue;
              const hit = b.shape.capsule
                ? pointNearSegment(px, py, b.shape.capsule.x1, b.shape.capsule.y1,
                  b.shape.capsule.x2, b.shape.capsule.y2, b.shape.capsule.r)
                : pointInPolygon(px, py, b.shape.points);
              if (hit) hits++;
            }
            if (hits > 0) {
              const cost = (hits / pts.length) * b.shape.opacity * weight;
              blame[p.id][b.shape.casterId] = (blame[p.id][b.shape.casterId] ?? 0) + cost;
            }
          }
        }
      }
      }
    }
  }

  const byId = new Map(casters.map((c) => [c.id, c]));
  for (const { p } of boxes) {
    const { num, den } = totals[p.id];
    const monthly = num.map((n, i) => (den[i] > 0 ? Math.min(1, n / den[i]) : 1));
    const denTotal = den.reduce((a, b) => a + b, 0);
    const annual = denTotal > 0
      ? num.reduce((a, b) => a + b, 0) / denTotal
      : 1;
    const worst = Object.entries(blame[p.id]).sort((a, b) => b[1] - a[1])[0];
    out[p.id] = {
      monthly,
      annual,
      ...(worst
        ? {
          worstCaster: {
            id: worst[0],
            label: byId.get(worst[0])?.label ?? 'something',
            lost: worst[1] / Math.max(1e-9, denTotal),
          },
        }
        : {}),
    };
  }
  return out;
}

/** Human-readable month names for the shade readouts. */
export { MONTHS };
