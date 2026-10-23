import { describe, expect, it } from 'vitest';
import { CLIMATE_PRESETS } from './climate';
import { createDefaultDesign, DESIGN_VERSION, normalizeDesign, YARD_RESULTS } from './defaults';
import { applyLog, resultsFromLog, SEED_LOG } from './yardLog';
import { simulate } from './simulate';
import { CATALOG_BY_ID } from './catalog';
import { evidenceMeta, isEvidenceTier } from './resources';

/** A design shaped the way it was before features, zones and climates existed. */
const legacy = () => ({
  version: 1,
  site: {
    name: 'Old yard', climate: 'temperateOceanic', annualRainfallMm: 850,
    rainfallShape: new Array(12).fill(1 / 12), peakSunHours: new Array(12).fill(3),
    meanTempC: [5, 5, 7, 10, 13, 16, 18, 18, 15, 12, 8, 6],
    etoMm: new Array(12).fill(50), lotAreaM2: 600, lotWidthM: 20, roofAreaM2: 90,
    household: 3, waterUsePerPersonLPerDay: 120, electricityPerPersonKwhPerDay: 4,
    caloriesPerPersonPerDay: 2200, proteinPerPersonKgPerMonth: 1.6,
    greywaterFraction: 0.55, soil: 'loam',
  },
  placements: [
    { id: 'p1', systemId: 'annual-beds', units: 40, x: 1, y: 11, enabled: true },
    { id: 'p2', systemId: 'poly-tank', units: 5, x: 13, y: 5, enabled: true },
  ],
  overrides: { 'annual-beds': { evidence: 'proven', yieldFactor: 1.3 } },
  customSystems: [],
});

describe('opening a design saved by an older version', () => {
  it('keeps the yard rather than starting over', () => {
    const d = normalizeDesign(legacy());
    expect(d.placements).toHaveLength(2);
    expect(d.placements[0].systemId).toBe('annual-beds');
    expect(d.site.name).toBe('Old yard');
    // The measurements someone entered are the last thing to throw away.
    expect(d.overrides['annual-beds'].yieldFactor).toBe(1.3);
    // `proven` predates the split into what actually happened when you tried
    // it; a save that still says so means it worked.
    expect(d.overrides['annual-beds'].evidence).toBe('testedSuccess');
  });

  it('supplies the fields that did not exist yet', () => {
    const d = normalizeDesign(legacy());
    expect(Array.isArray(d.features)).toBe(true);
    expect(Array.isArray(d.zones)).toBe(true);
    expect(Array.isArray(d.climates)).toBe(true);
    expect(d.version).toBe(DESIGN_VERSION);
    expect(typeof d.site.slopePercent).toBe('number');
    expect(typeof d.site.houseHeightM).toBe('number');
  });

  it('does not relocate the garden', () => {
    // A save from before latitude existed should take the latitude of the
    // climate it was already using, not wherever the app now starts.
    const d = normalizeDesign(legacy());
    const oceanic = CLIMATE_PRESETS.find((p) => p.id === 'temperateOceanic')!;
    expect(d.site.latitude).toBe(oceanic.refLatitude);
    expect(d.site.meanTempC).toEqual(legacy().site.meanTempC);
    expect(d.site.climateSource).toBe('preset');
    expect(d.site.observedPeakSunHours).toBeUndefined();
  });

  it('produces something the engine can actually run', () => {
    // This is the check that matters: the crash was a render, not a parse.
    const res = simulate(normalizeDesign(legacy()), CATALOG_BY_ID);
    expect(res.expected.placements).toHaveLength(2);
    expect(Number.isFinite(res.totals.capital)).toBe(true);
    expect(Number.isFinite(res.expected.resources.foodCalories.produced)).toBe(true);
  });

  it('survives every kind of rubbish', () => {
    const cases: unknown[] = [
      undefined, null, 0, 'design', [], {},
      { version: 1 },
      { version: 1, placements: 'not an array' },
      { ...legacy(), site: null },
      { ...legacy(), site: { climate: 'temperateOceanic' } },
      { ...legacy(), overrides: 'nope', customSystems: 3 },
      { ...legacy(), placements: [null, { systemId: 'annual-beds' }, { nope: true }] },
      { ...legacy(), site: { ...legacy().site, meanTempC: [1, 2, 3], latitude: 'north' } },
    ];
    for (const input of cases) {
      const d = normalizeDesign(input);
      expect(Array.isArray(d.features), String(input)).toBe(true);
      expect(Array.isArray(d.zones)).toBe(true);
      expect(Array.isArray(d.climates)).toBe(true);
      expect(d.site.meanTempC).toHaveLength(12);
      expect(Number.isFinite(d.site.latitude)).toBe(true);
      // And it must run, not merely typecheck.
      expect(() => simulate(d, CATALOG_BY_ID)).not.toThrow();
    }
  });

  it('leaves a current design alone', () => {
    const current = createDefaultDesign();
    const round = normalizeDesign(JSON.parse(JSON.stringify(current)));
    expect(round.placements).toHaveLength(current.placements.length);
    expect(round.features).toHaveLength(current.features.length);
    expect(round.site.climateSource).toBe('observed');
    expect(round.site.latitude).toBeCloseTo(current.site.latitude, 6);
  });

  it('fills in a placement that lost its numbers', () => {
    const d = normalizeDesign({
      ...legacy(),
      placements: [{ id: 'p1', systemId: 'annual-beds' }],
    });
    expect(d.placements[0].units).toBe(1);
    expect(d.placements[0].x).toBe(0);
    expect(d.placements[0].enabled).toBe(true);
  });
});

describe('evidence values from outside', () => {
  it('drops a tier it does not recognise instead of crashing on it', () => {
    // Hand-edited exports and files from a future version both land here.
    const d = normalizeDesign({
      ...legacy(),
      overrides: {
        'annual-beds': { evidence: 'gold-standard', yieldFactor: 1.1 },
        'solar-pv': { evidence: 'testedPartial' },
        'poly-tank': { evidence: 'proven' },
      },
    });
    expect(d.overrides['annual-beds'].evidence).toBeUndefined();
    // …while keeping the rest of that override.
    expect(d.overrides['annual-beds'].yieldFactor).toBe(1.1);
    // Known tiers pass through, and the retired one is mapped forward.
    expect(d.overrides['solar-pv'].evidence).toBe('testedPartial');
    expect(d.overrides['poly-tank'].evidence).toBe('testedSuccess');
    expect(() => simulate(d, CATALOG_BY_ID)).not.toThrow();
  });

  it('gives an unknown tier a meaning rather than undefined', () => {
    expect(evidenceMeta('nonsense').tier).toBe('researched');
    expect(evidenceMeta(undefined).tier).toBe('researched');
    expect(evidenceMeta('testedFailed').tier).toBe('testedFailed');
    expect(isEvidenceTier('testedFailed')).toBe(true);
    expect(isEvidenceTier('proven')).toBe(false);
  });
});

describe("the yard's own results", () => {
  it('ship with the starting design, not in the catalog', () => {
    const d = createDefaultDesign();
    expect(d.overrides.aerobin.evidence).toBe('testedSuccess');
    expect(d.overrides['biochar-tote'].evidence).toBe('testedSuccess');
    // The catalog entry itself still makes no claim about anyone's yard.
    expect(CATALOG_BY_ID.aerobin.evidence).toBe('researched');
    for (const id of Object.keys(YARD_RESULTS)) expect(CATALOG_BY_ID[id]).toBeDefined();
  });

  it('are read from the yard log, so the two cannot disagree', () => {
    const fromLog = resultsFromLog(SEED_LOG);
    expect(Object.keys(YARD_RESULTS).sort()).toEqual(
      Object.keys(fromLog).filter((id) => fromLog[id]).sort());
    for (const [id, ov] of Object.entries(YARD_RESULTS)) expect(ov.evidence).toBe(fromLog[id]);
  });

  it('reach a design saved before they existed, through the log', () => {
    // Opening a design no longer adds results; the log sets them at runtime.
    const d = normalizeDesign({ ...legacy(), version: 3 });
    expect(d.overrides.aerobin).toBeUndefined();
    const overrides = applyLog(d.overrides, SEED_LOG);
    expect(overrides.aerobin.evidence).toBe('testedSuccess');
    expect(overrides['biochar-kiln'].evidence).toBe('testedSuccess');
    // Without disturbing what was already there.
    expect(overrides['annual-beds'].yieldFactor).toBe(1.3);
  });

  it('never overrule a tier the user set when a design is opened', () => {
    // Where the user and the log disagree, the app carries the user's tier
    // into the log as a dated entry (see state/yardLog.test.ts); opening the
    // design must hand it over intact for that to happen.
    const d = normalizeDesign({
      ...legacy(),
      version: 3,
      overrides: { aerobin: { evidence: 'testedPartial', yieldFactor: 0.8 } },
    });
    expect(d.overrides.aerobin.evidence).toBe('testedPartial');
    expect(d.overrides.aerobin.yieldFactor).toBe(0.8);
  });

  it('are applied once, so clearing one later sticks', () => {
    const current = { ...createDefaultDesign(), overrides: {} };
    const d = normalizeDesign(JSON.parse(JSON.stringify(current)));
    expect(d.overrides.aerobin).toBeUndefined();
  });
});
