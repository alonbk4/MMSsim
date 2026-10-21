import { describe, expect, it } from 'vitest';
import { CATALOG_BY_ID } from './catalog';
import { applyLatitude, buildDrivers, CLIMATE_PRESETS, DAYS_IN_MONTH, DEFAULT_SITE, siteFromPreset } from './climate';
import { createDefaultDesign, emptyDesign, makePlacement } from './defaults';
import { EVIDENCE, EVIDENCE_ORDER, RESOURCE_ORDER, TESTED_TIERS } from './resources';
import { simulate } from './simulate';
import type { Design, EvidenceTier } from './types';

function designWith(...placements: ReturnType<typeof makePlacement>[]): Design {
  const d = emptyDesign();
  d.placements = placements;
  return d;
}

describe('climate drivers', () => {
  it('spreads plant growth across the year and sums to one', () => {
    for (const preset of CLIMATE_PRESETS) {
      const site = siteFromPreset(preset, DEFAULT_SITE);
      const drivers = buildDrivers(site);
      const total = drivers.growingShare.reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 6);
      expect(drivers.growingShare.every((v) => v >= 0)).toBe(true);
    }
  });

  it('gives a cold-continental site a shorter growing season than a subtropical one', () => {
    const cold = buildDrivers(siteFromPreset(CLIMATE_PRESETS[3], DEFAULT_SITE));
    const warm = buildDrivers(siteFromPreset(CLIMATE_PRESETS[2], DEFAULT_SITE));
    const coldActive = cold.growingShare.filter((v) => v > 0.02).length;
    const warmActive = warm.growingShare.filter((v) => v > 0.02).length;
    expect(coldActive).toBeLessThan(warmActive);
  });

  it('demands more irrigation in a desert than in a temperate oceanic climate', () => {
    const desert = buildDrivers(siteFromPreset(CLIMATE_PRESETS[4], DEFAULT_SITE));
    const oceanic = buildDrivers(siteFromPreset(CLIMATE_PRESETS[1], DEFAULT_SITE));
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(sum(desert.irrigationDemandPerM2)).toBeGreaterThan(sum(oceanic.irrigationDemandPerM2) * 2);
  });
});

describe('physical flows', () => {
  it('harvests roughly rainfall x area x runoff coefficient', () => {
    const design = designWith(makePlacement('roof-catchment', 60, 0, 0));
    const res = simulate(design, CATALOG_BY_ID);
    // 1 mm on 1 m² is 1 litre, less the runoff coefficient. Derived from the
    // site rather than hardcoded, so changing the default climate cannot
    // quietly invalidate the check.
    const expected = design.site.annualRainfallMm * 60 * 0.85;
    expect(res.expected.resources.waterIrrigation.produced).toBeCloseTo(expected, 0);
  });

  it('generates PV in line with peak sun hours and the standard derate', () => {
    const design = designWith(makePlacement('solar-pv', 4, 0, 0));
    const res = simulate(design, CATALOG_BY_ID);
    const perKw = res.expected.resources.electricity.produced / 4;
    // Sun-hours per day, times days, times the PVWatts derate.
    const expected = design.site.peakSunHours
      .reduce((a, h, i) => a + h * DAYS_IN_MONTH[i], 0) * 0.78;
    expect(perKw).toBeCloseTo(expected, 0);
    // And a sanity bound: no yard array anywhere makes this much or this little.
    expect(perKw).toBeGreaterThan(400);
    expect(perKw).toBeLessThan(2200);
  });

  it('ties panel output to latitude, not just to the climate preset', () => {
    const design = designWith(makePlacement('solar-pv', 4, 0, 0));
    const at40 = simulate({ ...design, site: applyLatitude(design.site, 40) }, CATALOG_BY_ID);
    const at60 = simulate({ ...design, site: applyLatitude(design.site, 60) }, CATALOG_BY_ID);
    const kwh = (r: ReturnType<typeof simulate>) => r.expected.resources.electricity.produced;
    expect(kwh(at40)).toBeGreaterThan(kwh(at60) * 1.15);

    // And the seasonal swing widens as you go north: a December in Scotland is
    // not a December in Sicily.
    const swing = (r: ReturnType<typeof simulate>) => {
      const m = r.expected.resources.electricity.months.map((x) => x.produced);
      return Math.max(...m) / Math.max(1e-9, Math.min(...m));
    };
    expect(swing(at60)).toBeGreaterThan(swing(at40));
  });

  it('scales output with the site, not just the system', () => {
    // Both sites built from presets on the same located ground, so this
    // compares the climates' cloud cover with the sun geometry held still.
    const base = designWith(makePlacement('solar-pv', 4, 0, 0));
    const at = (id: string) => {
      const preset = CLIMATE_PRESETS.find((p) => p.id === id)!;
      const design: Design = { ...base, site: siteFromPreset(preset, DEFAULT_SITE) };
      return simulate(design, CATALOG_BY_ID).expected.resources.electricity.produced;
    };
    expect(at('aridDesert')).toBeGreaterThan(at('temperateOceanic') * 1.35);
  });
});

describe('storage', () => {
  it('never exceeds capacity or goes negative', () => {
    const design = designWith(
      makePlacement('roof-catchment', 90, 0, 0),
      makePlacement('poly-tank', 3, 0, 0),
    );
    const res = simulate(design, CATALOG_BY_ID);
    const water = res.expected.resources.waterIrrigation;
    expect(water.capacity).toBe(3000);
    for (const m of water.months) {
      expect(m.stockEnd).toBeGreaterThanOrEqual(0);
      expect(m.stockEnd).toBeLessThanOrEqual(water.capacity + 1e-6);
    }
  });

  it('carries winter rain into the dry season in a mediterranean climate', () => {
    const base = designWith(
      makePlacement('roof-catchment', 120, 0, 0),
      makePlacement('annual-beds', 30, 0, 0),
    );
    base.site = siteFromPreset(CLIMATE_PRESETS[0], DEFAULT_SITE);
    const withoutTank = simulate(base, CATALOG_BY_ID);
    const withTank: Design = {
      ...base,
      placements: [...base.placements, makePlacement('poly-tank', 20, 0, 0)],
    };
    const tanked = simulate(withTank, CATALOG_BY_ID);
    expect(tanked.expected.resources.waterIrrigation.shortfall)
      .toBeLessThan(withoutTank.expected.resources.waterIrrigation.shortfall);
  });
});

describe('input chains', () => {
  it('derates a system whose required input is missing', () => {
    // Hens with no feed source and no household scraps to speak of.
    const design = designWith(makePlacement('laying-hens', 40, 0, 0));
    const res = simulate(design, CATALOG_BY_ID);
    const hens = res.expected.placements[0];
    expect(hens.runRate).toBeLessThan(1);
    expect(hens.limitedBy).toContain('animalFeed');
  });

  it('runs at full rate once the inputs are there', () => {
    const design = designWith(makePlacement('roof-catchment', 200, 0, 0));
    const res = simulate(design, CATALOG_BY_ID);
    expect(res.expected.placements[0].runRate).toBeCloseTo(1, 3);
  });

  it('feeds compost from the bays into the beds', () => {
    const beds = designWith(makePlacement('annual-beds', 40, 0, 0));
    const withCompost = designWith(
      makePlacement('annual-beds', 40, 0, 0),
      makePlacement('compost-bays', 4, 0, 0),
      makePlacement('poly-tank', 20, 0, 0),
      makePlacement('roof-catchment', 200, 0, 0),
    );
    const a = simulate(beds, CATALOG_BY_ID).expected.placements[0].runRate;
    const b = simulate(withCompost, CATALOG_BY_ID).expected.placements[0].runRate;
    expect(b).toBeGreaterThan(a);
  });
});

describe('optional inputs', () => {
  it('does not count a nice-to-have input as a household shortfall', () => {
    // Compost bays will take woody material if there is any, but not having it
    // is not a gap in the design the way missing drinking water is.
    const design = designWith(makePlacement('compost-bays', 3, 0, 0));
    const res = simulate(design, CATALOG_BY_ID);
    const biomass = res.expected.resources.biomass;
    expect(biomass.demanded).toBe(0);
    expect(biomass.coverage).toBe(1);
    expect(biomass.months.every((m) => m.demandedOptional > 0)).toBe(true);
    // The required input is still required.
    expect(res.expected.resources.organicWaste.months[0].demanded).toBeGreaterThan(0);
  });

  it('serves required demand before optional draws', () => {
    const design = designWith(
      makePlacement('coppice-woodlot', 100, 0, 0),
      makePlacement('compost-bays', 3, 0, 0),
      makePlacement('rocket-mass-heater', 1, 0, 0),
    );
    const res = simulate(design, CATALOG_BY_ID);
    const heater = res.expected.placements.find((p) => p.systemId === 'rocket-mass-heater')!;
    const bays = res.expected.placements.find((p) => p.systemId === 'compost-bays')!;
    // The heater needs biomass outright; the bays merely like it.
    expect(bays.limitedBy).not.toContain('biomass');
    expect(heater.runRate).toBeGreaterThan(0);
  });
});

describe('evidence tiers', () => {
  it('brackets expected output between the low and high cases', () => {
    const design = createDefaultDesign();
    const res = simulate(design, CATALOG_BY_ID);
    const r = 'electricity' as const;
    expect(res.low.resources[r].produced).toBeLessThan(res.expected.resources[r].produced);
    expect(res.high.resources[r].produced).toBeGreaterThan(res.expected.resources[r].produced);
  });

  it('penalises an unproven system far harder than a researched one', () => {
    const wind = designWith(makePlacement('micro-wind', 3, 0, 0));
    const pv = designWith(makePlacement('solar-pv', 3, 0, 0));
    const windRes = simulate(wind, CATALOG_BY_ID);
    const pvRes = simulate(pv, CATALOG_BY_ID);
    const ratio = (r: ReturnType<typeof simulate>) =>
      r.low.resources.electricity.produced / r.expected.resources.electricity.produced;
    expect(ratio(windRes)).toBeLessThan(ratio(pvRes));
  });

  it('promotes a system to proven when the user overrides it', () => {
    const design = designWith(makePlacement('annual-beds', 50, 0, 0));
    design.overrides['annual-beds'] = { evidence: 'testedSuccess', yieldFactor: 1.4 };
    const res = simulate(design, CATALOG_BY_ID);
    expect(res.expected.placements[0].evidence).toBe('testedSuccess');
    const spread = res.high.resources.foodCalories.produced / res.low.resources.foodCalories.produced;
    expect(spread).toBeLessThan(1.3);
  });
});

describe('result shape', () => {
  it('reports twelve months for every resource with coverage in range', () => {
    const res = simulate(createDefaultDesign(), CATALOG_BY_ID);
    for (const r of RESOURCE_ORDER) {
      const y = res.expected.resources[r];
      expect(y.months).toHaveLength(12);
      expect(y.coverage).toBeGreaterThanOrEqual(0);
      expect(y.coverage).toBeLessThanOrEqual(1);
      expect(Number.isFinite(y.produced)).toBe(true);
    }
  });

  it('flags a design that does not fit on the lot', () => {
    const design = designWith(makePlacement('annual-beds', 900, 0, 0));
    const res = simulate(design, CATALOG_BY_ID);
    expect(res.warnings.some((w) => w.level === 'error' && w.title.includes('bigger than the yard'))).toBe(true);
  });

  it('flags roof systems competing for the same roof', () => {
    const design = designWith(
      makePlacement('roof-catchment', 80, 0, 0),
      makePlacement('solar-pv', 6, 0, 0),
    );
    const res = simulate(design, CATALOG_BY_ID);
    expect(res.totals.roofM2).toBeCloseTo(80 + 36, 6);
    expect(res.warnings.some((w) => w.title.includes('roof'))).toBe(true);
  });

  it('an empty design leaves every household need uncovered', () => {
    const res = simulate(emptyDesign(), CATALOG_BY_ID);
    expect(res.expected.resources.foodCalories.coverage).toBe(0);
    expect(res.expected.resources.electricity.coverage).toBe(0);
    expect(res.totals.capital).toBe(0);
  });
});

describe('catalog integrity', () => {
  it('has unique ids, sane ranges and notes on every entry', () => {
    const ids = new Set<string>();
    for (const s of Object.values(CATALOG_BY_ID)) {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(s.unitMin).toBeLessThanOrEqual(s.unitDefault);
      expect(s.unitDefault).toBeLessThanOrEqual(s.unitMax);
      expect(s.unitStep).toBeGreaterThan(0);
      expect(s.notes.length).toBeGreaterThan(20);
      expect(s.sources.length).toBeGreaterThan(0);
      expect(s.flows.length).toBeGreaterThan(0);
      for (const f of s.flows) {
        expect(RESOURCE_ORDER).toContain(f.resource);
      }
    }
  });

  it('ships nothing as tested — that tier means you built it yourself', () => {
    for (const s of Object.values(CATALOG_BY_ID)) {
      expect(TESTED_TIERS).not.toContain(s.evidence);
    }
  });
});

describe('what happened when you tried it', () => {
  const bedsWith = (evidence: EvidenceTier) => {
    const design = designWith(makePlacement('annual-beds', 50, 0, 0));
    design.overrides['annual-beds'] = { evidence };
    return simulate(design, CATALOG_BY_ID);
  };
  const food = (r: ReturnType<typeof simulate>) => r.expected.resources.foodCalories.produced;

  it('ranks the tiers from least to most certain', () => {
    expect(EVIDENCE_ORDER).toEqual([
      'experimental', 'researched', 'testedFailed', 'testedPartial', 'testedSuccess',
    ]);
    // Each step narrows the range, apart from the tested tiers which are
    // narrow because you watched what happened.
    const width = (t: EvidenceTier) => EVIDENCE[t].high - EVIDENCE[t].low;
    expect(width('experimental')).toBeGreaterThan(width('researched'));
    expect(width('researched')).toBeGreaterThan(width('testedSuccess'));
  });

  it('moves the headline number, not just the range', () => {
    // This was the flaw in the single `proven` tier: the middle case ignored
    // it entirely, so recording an outcome changed nothing you would notice.
    expect(food(bedsWith('testedPartial'))).toBeLessThan(food(bedsWith('testedSuccess')));
    expect(food(bedsWith('testedFailed'))).toBeLessThan(food(bedsWith('testedPartial')));
  });

  it('counts a failure as producing next to nothing', () => {
    const failed = food(bedsWith('testedFailed'));
    const works = food(bedsWith('testedSuccess'));
    expect(failed).toBeLessThan(works * 0.1);
    expect(failed).toBeGreaterThanOrEqual(0);
  });

  it('still charges for a failure — the money and the ground are spent', () => {
    const res = bedsWith('testedFailed');
    expect(res.totals.capital).toBeGreaterThan(0);
    expect(res.totals.footprintM2).toBeGreaterThan(0);
    expect(res.totals.laborHoursPerYear).toBeGreaterThan(0);
  });

  it('says so in the results rather than leaving it on the plan quietly', () => {
    const res = bedsWith('testedFailed');
    expect(res.warnings.some((w) => /failed here/i.test(w.title))).toBe(true);
  });

  it('leaves a researched system where it was', () => {
    // Splitting the tested tier must not have moved anything else.
    const before = food(bedsWith('researched'));
    const plain = food(simulate(designWith(makePlacement('annual-beds', 50, 0, 0)), CATALOG_BY_ID));
    expect(before).toBeCloseTo(plain, 6);
  });
});
