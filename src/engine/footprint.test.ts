import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { makePlacement } from './defaults';
import { planFootprint } from './footprint';

describe('plan footprints', () => {
  it('draws something visible and roughly tappable for every system', () => {
    for (const def of CATALOG) {
      const fp = planFootprint(def, makePlacement(def.id, def.unitDefault, 0, 0));
      expect(fp.w).toBeGreaterThan(0.5);
      expect(fp.h).toBeGreaterThan(0.5);
      // Nothing should come out as a hairline sliver at a normal zoom, however
      // elongated its archetype or small its footprint.
      expect(Math.min(fp.w, fp.h), def.id).toBeGreaterThanOrEqual(0.7);
      expect(Number.isFinite(fp.areaM2)).toBe(true);
    }
  });

  it('never draws one mark per square metre', () => {
    // `cluster` counts units, so a system sized by area would draw hundreds of
    // specimens — which is exactly what the coppice woodlot used to do.
    for (const def of CATALOG) {
      const fp = planFootprint(def, makePlacement(def.id, def.unitDefault, 0, 0));
      if (fp.shape.kind !== 'cluster') continue;
      expect(def.unitLabel).not.toMatch(/m²/);
      expect(fp.shape.items.length).toBeLessThanOrEqual(40);
    }
  });

  it('gives a zero-footprint system something you can still tap', () => {
    // Trellises, drip lines and mulch are credited against ground they do not
    // own, so their footprint is nil and the drawn shape is a minimum.
    for (const id of ['grow-trellis', 'drip-irrigation', 'sheet-mulch']) {
      const def = CATALOG.find((d) => d.id === id)!;
      const fp = planFootprint(def, makePlacement(id, def.unitDefault, 0, 0));
      expect(Math.min(fp.w, fp.h), id).toBeGreaterThanOrEqual(0.7);
    }
  });

  it('keeps the drawn area equal to the engine area for simple shapes', () => {
    for (const def of CATALOG) {
      const p = makePlacement(def.id, def.unitDefault, 0, 0);
      const fp = planFootprint(def, p);
      const engineArea = Math.max(
        def.footprintPerUnit * p.units,
        (def.roofFootprintPerUnit ?? 0) * p.units,
      );
      if (engineArea < 1.4) continue; // clamped up so it stays visible
      if (fp.shape.kind === 'block' || fp.shape.kind === 'roof' || fp.shape.kind === 'cells') {
        expect(fp.w * fp.h).toBeCloseTo(engineArea, 4);
      }
    }
  });

  it('is stable — the same placement always draws the same', () => {
    const def = CATALOG.find((d) => d.id === 'water-pond')!;
    const p = makePlacement('water-pond', 15, 0, 0);
    expect(JSON.stringify(planFootprint(def, p))).toBe(JSON.stringify(planFootprint(def, p)));
  });
});
