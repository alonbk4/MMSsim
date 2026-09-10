import { describe, expect, it } from 'vitest';
import { applyLatitude, applySlope, DEFAULT_SITE, getPreset, siteFromPreset } from './climate';
import { ANN_ARBOR } from './data/observed/ann-arbor';
import { applyObservedClimate, observedClearness, parseObservedClimate } from './observed';

const payload = () => ({
  mmssimClimate: 1,
  source: 'Open-Meteo ERA5 archive (CC-BY-4.0)',
  fetched: '2026-09-10',
  latitude: 42.27, longitude: -83.73, years: [2010, 2024],
  elevation: 270, timezone: 'America/Detroit', missing: [],
  meanTempC: ANN_ARBOR.meanTempC,
  rainfallMm: ANN_ARBOR.rainfallMm,
  etoMm: ANN_ARBOR.etoMm,
  peakSunHours: ANN_ARBOR.peakSunHours,
});

describe('parsing a climate record', () => {
  it('accepts what the fetch tool produces', () => {
    const out = parseObservedClimate(payload());
    expect('error' in out).toBe(false);
    expect((out as any).latitude).toBe(42.27);
  });

  it('accepts it as a pasted string too', () => {
    const out = parseObservedClimate(JSON.stringify(payload()));
    expect('error' in out).toBe(false);
  });

  it('refuses anything that is half a record', () => {
    const cases: [string, unknown][] = [
      ['not JSON', 'hello {'],
      ['wrong shape', { hello: 'world' }],
      ['incomplete fetch', { ...payload(), missing: ['et0_fao_evapotranspiration'] }],
      ['short series', { ...payload(), meanTempC: [1, 2, 3] }],
      ['non-numeric series', { ...payload(), rainfallMm: new Array(12).fill('wet') }],
      ['no latitude', { ...payload(), latitude: undefined }],
      ['impossible rainfall', { ...payload(), rainfallMm: new Array(12).fill(0) }],
      ['impossible sun', { ...payload(), peakSunHours: new Array(12).fill(30) }],
    ];
    for (const [why, input] of cases) {
      const out = parseObservedClimate(input);
      expect(out, why).toHaveProperty('error');
    }
  });
});

describe('applying a climate record', () => {
  it('takes the measured numbers verbatim', () => {
    const site = applyObservedClimate(DEFAULT_SITE, ANN_ARBOR);
    expect(site.meanTempC).toEqual(ANN_ARBOR.meanTempC);
    expect(site.etoMm).toEqual(ANN_ARBOR.etoMm);
    expect(site.peakSunHours).toEqual(ANN_ARBOR.peakSunHours);
    expect(site.latitude).toBe(42.27);
    expect(site.annualRainfallMm).toBeCloseTo(915, 0);
    expect(site.rainfallShape.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it('carries where it came from', () => {
    const site = applyObservedClimate(DEFAULT_SITE, ANN_ARBOR);
    expect(site.climateSource).toBe('observed');
    expect(site.climateLabel).toBe('Observed 2010–2024');
    expect(site.climateProvenance).toContain('Open-Meteo');
    expect(site.climateYears).toEqual([2010, 2024]);
  });

  it('leaves the measured sun alone when nothing has moved', () => {
    const site = applySlope(applyObservedClimate(DEFAULT_SITE, ANN_ARBOR), 0, 180);
    expect(site.peakSunHours).toEqual(ANN_ARBOR.peakSunHours);
  });

  it('scales real cloud seasonality rather than replacing it', () => {
    const here = applyObservedClimate(DEFAULT_SITE, ANN_ARBOR);
    const north = applyLatitude(here, 55);
    // Less sun overall…
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(sum(north.peakSunHours)).toBeLessThan(sum(here.peakSunHours));
    // …but the shape is still the measured one, not a smooth model curve. Ann
    // Arbor's July dips below June because of summer cloud; that must survive.
    expect(here.peakSunHours[6]).toBeLessThan(here.peakSunHours[5]);
    expect(north.peakSunHours[6]).toBeLessThan(north.peakSunHours[5]);
  });

  it('gains winter sun from a slope leaning at it', () => {
    const flat = applySlope(applyObservedClimate(DEFAULT_SITE, ANN_ARBOR), 0, 180);
    const tilted = applySlope(flat, 20, 180);
    expect(tilted.peakSunHours[11]).toBeGreaterThan(flat.peakSunHours[11]);
  });

  it('drops the record when a preset is chosen instead', () => {
    const observed = applyObservedClimate(DEFAULT_SITE, ANN_ARBOR);
    const preset = siteFromPreset(getPreset('mediterranean'), observed);
    expect(preset.climateSource).toBe('preset');
    expect(preset.observedPeakSunHours).toBeUndefined();
    expect(preset.peakSunHours).not.toEqual(ANN_ARBOR.peakSunHours);
  });

  it('derives a credible cloudiness for the measured site', () => {
    const k = observedClearness(ANN_ARBOR);
    expect(k).toBeGreaterThan(0.3);
    expect(k).toBeLessThan(0.7);
  });
});

describe('the shipped Ann Arbor record', () => {
  it('is the site the app starts on', () => {
    expect(DEFAULT_SITE.climateSource).toBe('observed');
    expect(DEFAULT_SITE.latitude).toBeCloseTo(42.27, 2);
  });

  it('matches what is known about that ground', () => {
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(sum(ANN_ARBOR.rainfallMm)).toBeGreaterThan(850);
    expect(sum(ANN_ARBOR.rainfallMm)).toBeLessThan(1000);
    expect(ANN_ARBOR.meanTempC[0]).toBeLessThan(0);   // January below freezing
    expect(ANN_ARBOR.meanTempC[6]).toBeGreaterThan(20); // July in the low twenties
    // Summer evaporation outruns summer rain, which is why July needs watering.
    const jja = (xs: number[]) => sum(xs.slice(5, 8));
    expect(jja(ANN_ARBOR.etoMm)).toBeGreaterThan(jja(ANN_ARBOR.rainfallMm));
  });
});
