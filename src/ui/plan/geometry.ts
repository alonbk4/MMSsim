/**
 * Plan geometry — what shape a system actually is on the ground.
 *
 * The canvas used to draw every placement as a square of the right area. The
 * area was honest and everything else was a lie: a pond, a hedge and a hen run
 * are not the same shape, and six fruit trees are six canopies rather than one
 * block. This module turns a system plus its size into a real footprint, which
 * both plan styles then paint differently.
 *
 * Areas stay exact. Only the outline changes.
 */
import type { Placement, SystemDef, SystemCategory } from '../../engine/types';

export type PlanShape =
  /** A rectangle. `rows` draws planting rows or bays inside it. */
  | { kind: 'block'; w: number; h: number; aspect: number; rows: number }
  /** Repeated circles — one per unit. Trees, shrubs, hives. */
  | { kind: 'cluster'; w: number; h: number; items: { x: number; y: number; r: number }[] }
  /** An organic outline. Ponds, wetlands, forest edges. */
  | { kind: 'blob'; w: number; h: number; seed: number }
  /** A long strip that follows the slope. Swales, hedges, drip lines. */
  | { kind: 'band'; w: number; h: number; thickness: number }
  /** Circular in plan. Tanks, kilns, bins. */
  | { kind: 'disc'; w: number; h: number; r: number }
  /** Adjacent compartments. Compost bays, cold frames. */
  | { kind: 'cells'; w: number; h: number; count: number }
  /** Sits on the roof rather than the ground. */
  | { kind: 'roof'; w: number; h: number; grid: 'panels' | 'sheets' }
  /** Fenced area with a structure in one corner. Runs, coops. */
  | { kind: 'enclosure'; w: number; h: number; hut: number };

export interface PlanFootprint {
  shape: PlanShape;
  /** Bounding box in metres. */
  w: number;
  h: number;
  /** Ground area represented, m². Always the engine's figure. */
  areaM2: number;
  onRoof: boolean;
}

type Archetype =
  | { kind: 'block'; aspect?: number; rows?: number }
  | { kind: 'cluster'; itemAreaM2: number; maxItems?: number }
  | { kind: 'blob' }
  | { kind: 'band'; thickness?: number }
  | { kind: 'disc' }
  | { kind: 'cells'; per?: number }
  | { kind: 'roof'; grid: 'panels' | 'sheets' }
  | { kind: 'enclosure' };

/**
 * How each system sits on the ground. Anything not listed falls back to its
 * category default, so an unlisted or user-authored system still draws.
 */
const ARCHETYPES: Record<string, Archetype> = {
  // Water
  'roof-catchment': { kind: 'roof', grid: 'sheets' },
  'poly-tank': { kind: 'disc' },
  'ferrocement-cistern': { kind: 'disc' },
  'swale-berm': { kind: 'band', thickness: 1.4 },
  'greywater-branched-drain': { kind: 'cluster', itemAreaM2: 2, maxItems: 20 },
  'constructed-wetland': { kind: 'blob' },
  'slow-sand-filter': { kind: 'cells', per: 1.5 },
  'uv-ro-treatment': { kind: 'block', aspect: 1.6 },
  'drip-irrigation': { kind: 'band', thickness: 0.5 },
  'sheet-mulch': { kind: 'block', aspect: 1.5 },
  'hand-well': { kind: 'disc' },
  'atmospheric-water': { kind: 'block', aspect: 1.3 },
  'fog-net': { kind: 'band', thickness: 0.4 },

  // Energy
  'solar-pv': { kind: 'roof', grid: 'panels' },
  'battery-bank': { kind: 'block', aspect: 1.8 },
  'solar-thermal': { kind: 'roof', grid: 'panels' },
  'rocket-mass-heater': { kind: 'block', aspect: 2.2 },
  'coppice-woodlot': { kind: 'cluster', itemAreaM2: 9, maxItems: 60 },
  'solar-dehydrator': { kind: 'block', aspect: 1.6 },
  'biogas-digester': { kind: 'disc' },
  'micro-wind': { kind: 'disc' },
  'micro-hydro': { kind: 'block', aspect: 1.4 },
  'wood-gasifier': { kind: 'block', aspect: 1.5 },

  // Food
  'annual-beds': { kind: 'block', aspect: 2.2, rows: 5 },
  'staple-potato-bed': { kind: 'block', aspect: 2.4, rows: 4 },
  'winter-squash': { kind: 'block', aspect: 1.8, rows: 3 },
  'biointensive-bed': { kind: 'block', aspect: 2.6, rows: 6 },
  'hugelkultur': { kind: 'band', thickness: 1.8 },
  'polytunnel': { kind: 'block', aspect: 3, rows: 3 },
  'food-forest': { kind: 'blob' },
  'fruit-trees': { kind: 'cluster', itemAreaM2: 16, maxItems: 40 },
  'berry-hedge': { kind: 'band', thickness: 1.5 },
  'laying-hens': { kind: 'enclosure' },
  'meat-rabbits': { kind: 'enclosure' },
  'ducks': { kind: 'enclosure' },
  'beehive': { kind: 'cluster', itemAreaM2: 2, maxItems: 20 },
  'mushroom-logs': { kind: 'band', thickness: 0.8 },
  'aquaponics': { kind: 'block', aspect: 2.4, rows: 3 },
  'root-cellar': { kind: 'block', aspect: 1.4 },
  'bsf-larvae': { kind: 'cells', per: 1.2 },
  'fodder-sprouts': { kind: 'block', aspect: 2 },
  'duckweed-pond': { kind: 'blob' },

  // Sanitation
  'composting-toilet': { kind: 'block', aspect: 1.2 },
  'humanure-system': { kind: 'cells', per: 1.5 },
  'septic-leachfield': { kind: 'block', aspect: 2.8, rows: 4 },
  'worm-flush-toilet': { kind: 'block', aspect: 1.4 },

  // Soil
  'compost-bays': { kind: 'cells', per: 1.3 },
  'vermicompost': { kind: 'cells', per: 1.1 },
  'chop-and-drop': { kind: 'band', thickness: 1.2 },
  'cover-crop': { kind: 'block', aspect: 1.6, rows: 4 },
  'biochar-kiln': { kind: 'disc' },
  'bokashi': { kind: 'cells', per: 0.2 },

  // Shelter
  'attached-greenhouse': { kind: 'block', aspect: 2, rows: 2 },
  'thermal-mass-wall': { kind: 'band', thickness: 0.4 },
  'shade-structure': { kind: 'block', aspect: 1.6 },
  'water-pond': { kind: 'blob' },
};

const CATEGORY_DEFAULT: Record<SystemCategory, Archetype> = {
  water: { kind: 'disc' },
  food: { kind: 'block', aspect: 2, rows: 4 },
  energy: { kind: 'block', aspect: 1.6 },
  sanitation: { kind: 'block', aspect: 1.3 },
  soil: { kind: 'cells', per: 1.3 },
  shelter: { kind: 'block', aspect: 1.5 },
};

/** Smallest footprint we will draw, so a 0.2 m² bin is still a tap target. */
const MIN_AREA = 1.4;

export function planFootprint(def: SystemDef, placement: Placement): PlanFootprint {
  const ground = def.footprintPerUnit * placement.units;
  const roof = (def.roofFootprintPerUnit ?? 0) * placement.units;
  const onRoof = ground <= 0 && roof > 0;
  const areaM2 = Math.max(MIN_AREA, onRoof ? roof : ground);
  const arch = ARCHETYPES[def.id] ?? CATEGORY_DEFAULT[def.category];
  const shape = buildShape(arch, areaM2, placement);
  return { shape, w: shape.w, h: shape.h, areaM2, onRoof };
}

function buildShape(arch: Archetype, area: number, placement: Placement): PlanShape {
  switch (arch.kind) {
    case 'block': {
      const aspect = arch.aspect ?? 1.5;
      const w = Math.sqrt(area * aspect);
      return { kind: 'block', w, h: area / w, aspect, rows: arch.rows ?? 0 };
    }
    case 'roof': {
      const w = Math.sqrt(area * 1.9);
      return { kind: 'roof', w, h: area / w, grid: arch.grid };
    }
    case 'disc': {
      const r = Math.sqrt(area / Math.PI);
      return { kind: 'disc', w: r * 2, h: r * 2, r };
    }
    case 'blob': {
      const w = Math.sqrt(area * 1.35);
      return { kind: 'blob', w, h: area / w, seed: hash(placement.id) };
    }
    case 'band': {
      // A strip keeps its width and gets longer, the way a swale or hedge does.
      const thickness = arch.thickness ?? 1.2;
      const length = Math.max(thickness * 1.5, area / thickness);
      return { kind: 'band', w: length, h: thickness * 1.9, thickness };
    }
    case 'cells': {
      const per = arch.per ?? 1.3;
      const count = Math.max(1, Math.min(8, Math.round(area / per)));
      const cell = area / count;
      const side = Math.sqrt(cell);
      return { kind: 'cells', w: side * count, h: side, count };
    }
    case 'enclosure': {
      const w = Math.sqrt(area * 1.45);
      const h = area / w;
      return { kind: 'enclosure', w, h, hut: Math.min(w, h) * 0.34 };
    }
    case 'cluster': {
      // One mark per unit — six fruit trees read as six canopies, not a block.
      const max = arch.maxItems ?? 40;
      const count = Math.max(1, Math.min(max, Math.round(placement.units)));
      const per = area / count;
      const r = Math.sqrt(per / Math.PI);
      const cols = Math.max(1, Math.round(Math.sqrt(count * 1.3)));
      const rows = Math.ceil(count / cols);
      const pitch = r * 2.05;
      const items: { x: number; y: number; r: number }[] = [];
      const jitter = mulberry(hash(placement.id));
      for (let i = 0; i < count; i++) {
        const cx = i % cols;
        const cy = Math.floor(i / cols);
        // A little scatter so an orchard does not look like a spreadsheet.
        items.push({
          x: r + cx * pitch + (jitter() - 0.5) * r * 0.35,
          y: r + cy * pitch + (jitter() - 0.5) * r * 0.35,
          r,
        });
      }
      return { kind: 'cluster', w: cols * pitch, h: rows * pitch, items };
    }
  }
}

/* ---------- deterministic noise, so a placement always draws the same ---------- */

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An organic closed outline of the given bounding box, stable per seed. */
export function blobPath(w: number, h: number, seed: number, points = 9): string {
  const rnd = mulberry(seed);
  const cx = w / 2, cy = h / 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const wobble = 0.82 + rnd() * 0.34;
    pts.push([cx + Math.cos(a) * cx * wobble, cy + Math.sin(a) * cy * wobble]);
  }
  // Closed Catmull-Rom through the points, emitted as cubic béziers.
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < points; i++) {
    const p0 = pts[(i - 1 + points) % points];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % points];
    const p3 = pts[(i + 2) % points];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

/** A gently curving strip, as a swale on contour would run. */
export function bandPath(length: number, thickness: number, seed: number): string {
  const amp = Math.min(thickness * 1.1, length * 0.09);
  const mid = thickness * 0.95;
  const wave = (x: number) => mid + Math.sin((x / length) * Math.PI * 1.7 + (seed % 10) * 0.3) * amp;
  const steps = 14;
  let top = '';
  let bottom = '';
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * length;
    const y = wave(x);
    top += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${(y - thickness / 2).toFixed(2)}`;
  }
  for (let i = steps; i >= 0; i--) {
    const x = (i / steps) * length;
    const y = wave(x);
    bottom += `L${x.toFixed(2)},${(y + thickness / 2).toFixed(2)}`;
  }
  return `${top}${bottom}Z`;
}

/** The centre line of the same strip, for hatching or a contour tick. */
export function bandCentreline(length: number, thickness: number, seed: number): string {
  const amp = Math.min(thickness * 1.1, length * 0.09);
  const mid = thickness * 0.95;
  let d = '';
  for (let i = 0; i <= 14; i++) {
    const x = (i / 14) * length;
    const y = mid + Math.sin((x / length) * Math.PI * 1.7 + (seed % 10) * 0.3) * amp;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d;
}
