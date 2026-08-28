import { describe, expect, it } from 'vitest';
import { applyLatitude, DEFAULT_SITE } from './climate';
import { emptyDesign, makePlacement } from './defaults';
import { collectCasters, shadowsAt, sunExposure } from './shade';
import { JUNE_SOLSTICE, sunTrack } from './solar';
import type { Design, SiteFeature } from './types';

function design(features: SiteFeature[], placements = [makePlacement('annual-beds', 20, 10, 10)]): Design {
  const d = emptyDesign();
  d.site = { ...d.site, roofAreaM2: 0, latitude: 52 };
  d.placements = placements;
  d.features = features;
  return d;
}

const wall = (over: Partial<SiteFeature> = {}): SiteFeature => ({
  id: 'w1', kind: 'wall', x: 8, y: 14, w: 12, d: 0.3,
  heightM: 3, foliage: 'solid', occupiesGround: false, ...over,
});

describe('shadow geometry', () => {
  it('throws the shadow away from the sun', () => {
    // Sun due south and low: the shadow must run north, which is −y on the plan.
    const shapes = shadowsAt(
      [{ id: 'a', shape: 'box', x: 0, y: 0, w: 2, d: 2, heightM: 4, foliage: 'solid', label: 'a' }],
      { azimuth: 180, altitude: 30 }, true,
    );
    expect(shapes).toHaveLength(1);
    const ys = shapes[0].points.map(([, y]) => y);
    expect(Math.min(...ys)).toBeLessThan(-4);
  });

  it('makes the shadow longer as the sun gets lower', () => {
    const caster = [{ id: 'a', shape: 'box' as const, x: 0, y: 0, w: 1, d: 1, heightM: 5, foliage: 'solid' as const, label: 'a' }];
    const span = (alt: number) => {
      const p = shadowsAt(caster, { azimuth: 180, altitude: alt }, true)[0].points;
      const ys = p.map(([, y]) => y);
      return Math.max(...ys) - Math.min(...ys);
    };
    expect(span(20)).toBeGreaterThan(span(60));
  });

  it('ignores obstructions once the sun is below the horizon', () => {
    expect(shadowsAt(
      [{ id: 'a', shape: 'box', x: 0, y: 0, w: 2, d: 2, heightM: 4, foliage: 'solid', label: 'a' }],
      { azimuth: 180, altitude: 1 }, true,
    )).toHaveLength(0);
  });
});

describe('sun exposure', () => {
  it('gives an open site the whole sky', () => {
    const e = sunExposure(design([]));
    const only = Object.values(e)[0];
    expect(only.annual).toBe(1);
    expect(only.monthly.every((v) => v === 1)).toBe(true);
  });

  it('takes light away when something is put on the sunny side', () => {
    const open = Object.values(sunExposure(design([])))[0];
    const shaded = Object.values(sunExposure(design([wall({ heightM: 5 })])))[0];
    expect(shaded.annual).toBeLessThan(open.annual);
    expect(shaded.annual).toBeGreaterThan(0);
  });

  it('costs more light in winter than in summer, from the same wall', () => {
    const e = Object.values(sunExposure(design([wall({ heightM: 5 })])))[0];
    // December is index 11, June is index 5. Low winter sun, long shadow.
    expect(e.monthly[11]).toBeLessThan(e.monthly[5]);
  });

  it('names the obstruction that costs the most', () => {
    const e = Object.values(sunExposure(design([wall({ heightM: 6, label: 'Big wall' })])))[0];
    expect(e.worstCaster?.label).toBe('Big wall');
    expect(e.worstCaster!.lost).toBeGreaterThan(0);
  });

  it('lets a bare deciduous tree through in winter and not in summer', () => {
    const tree = (foliage: 'deciduous' | 'evergreen'): SiteFeature => ({
      id: 't', kind: 'tree', x: 6, y: 14, w: 7, d: 7,
      heightM: 8, foliage, occupiesGround: true,
    });
    const dec = Object.values(sunExposure(design([tree('deciduous')])))[0];
    const eve = Object.values(sunExposure(design([tree('evergreen')])))[0];
    // Same tree, same place: the evergreen costs more over the year…
    expect(eve.annual).toBeLessThan(dec.annual);
    // …and the gap is in the leafless months, not the summer.
    expect(dec.monthly[0]).toBeGreaterThan(eve.monthly[0]);
    expect(dec.monthly[6]).toBeCloseTo(eve.monthly[6], 1);
  });

  it('does not let a plot shade itself', () => {
    const d = design([], [makePlacement('fruit-trees', 6, 10, 10)]);
    const e = Object.values(sunExposure(d))[0];
    expect(e.annual).toBe(1);
  });

  it('lets a planted tree shade its neighbour', () => {
    const beds = makePlacement('annual-beds', 20, 10, 8);
    const alone = sunExposure(design([], [beds]));
    const withTrees = sunExposure(design([], [
      beds, makePlacement('fruit-trees', 6, 8, 16),
    ]));
    expect(withTrees[beds.id].annual).toBeLessThan(alone[beds.id].annual);
  });

  it('does not let the house shade the panels bolted to it', () => {
    const d = design([], [makePlacement('solar-pv', 4, 1, 1)]);
    d.site = { ...d.site, roofAreaM2: 120, houseHeightM: 7, houseX: 0.5, houseY: 0.5 };
    expect(Object.values(sunExposure(d))[0].annual).toBe(1);
  });

  it('shades a ground plot with the same house that spares the roof', () => {
    // North is −y, so a bed north of the house sits in its shadow; the panels
    // on the roof of that same house do not.
    const d = design([], [
      makePlacement('solar-pv', 4, 1, 15),
      makePlacement('annual-beds', 20, 2, 6),
    ]);
    d.site = { ...d.site, roofAreaM2: 120, houseHeightM: 7, houseX: 0.5, houseY: 14 };
    const e = sunExposure(d);
    const [roof, ground] = d.placements.map((p) => e[p.id].annual);
    expect(roof).toBe(1);
    expect(ground).toBeLessThan(1);
  });

  it('counts the house as an obstruction', () => {
    const d = design([]);
    d.site = { ...d.site, roofAreaM2: 120, houseHeightM: 7, houseX: 6, houseY: 15 };
    expect(collectCasters(d).some((c) => c.id === 'house')).toBe(true);
    expect(Object.values(sunExposure(d))[0].annual).toBeLessThan(1);
  });

  it('shades a southern-hemisphere plot from the north instead', () => {
    // The bed sits at y 10–13.5. Below the equator the midday sun is in the
    // north, so only the wall on the northern side can fall across it.
    const northSide: SiteFeature = { ...wall(), y: 8, heightM: 4 };
    const southSide: SiteFeature = { ...wall(), y: 14.5, heightM: 4 };
    const south = (f: SiteFeature) => {
      const d = design([f]);
      d.site = applyLatitude({ ...DEFAULT_SITE, roofAreaM2: 0 }, -34);
      d.placements = [makePlacement('annual-beds', 20, 10, 10)];
      return Object.values(sunExposure(d))[0].annual;
    };
    // Below the equator the midday sun is in the north, so the northern wall bites.
    expect(south(northSide)).toBeLessThan(south(southSide));
  });

  it('runs fast enough to redraw while dragging', () => {
    const d = design(
      Array.from({ length: 8 }, (_, i) => wall({ id: `w${i}`, x: i * 3, y: 6 + i })),
      Array.from({ length: 14 }, (_, i) => makePlacement('annual-beds', 20, (i % 5) * 6, Math.floor(i / 5) * 7 + 8)),
    );
    const t0 = performance.now();
    sunExposure(d);
    expect(performance.now() - t0).toBeLessThan(120);
  });
});

describe('sun track sanity', () => {
  it('keeps the midday sun to the south in the north', () => {
    const track = sunTrack(52, JUNE_SOLSTICE);
    const noon = track.reduce((a, b) => (b.altitude > a.altitude ? b : a));
    expect(noon.azimuth).toBeGreaterThan(150);
    expect(noon.azimuth).toBeLessThan(210);
  });
});
