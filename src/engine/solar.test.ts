import { describe, expect, it } from 'vitest';
import {
  applyLatitude, applySlope, buildDrivers, CLIMATE_PRESETS, DEFAULT_SITE,
  getPreset, runoffFraction, siteFromPreset, solarLatitude,
} from './climate';
import {
  clearSkyDaily, clearnessIndex, dayLengthMonthly, DECEMBER_SOLSTICE, JUNE_SOLSTICE,
  noonAltitude, peakSunHoursAt, sunSummary, sunTrack,
} from './solar';

describe('solar geometry', () => {
  it('puts the sun overhead at the equator on the equinox', () => {
    expect(noonAltitude(0, 80)).toBeGreaterThan(89);
  });

  it('matches the known solstice sun angles for a mid-latitude site', () => {
    // 52°N: 90 - 52 + 23.44 = 61.4 in June, 90 - 52 - 23.44 = 14.6 in December.
    expect(noonAltitude(52, JUNE_SOLSTICE)).toBeCloseTo(61.4, 0);
    expect(noonAltitude(52, DECEMBER_SOLSTICE)).toBeCloseTo(14.6, 0);
  });

  it('gives the right day lengths at the solstices', () => {
    const s = sunSummary(52);
    expect(s.summerDayLength).toBeGreaterThan(16);
    expect(s.summerDayLength).toBeLessThan(17.2);
    expect(s.winterDayLength).toBeGreaterThan(7.4);
    expect(s.winterDayLength).toBeLessThan(8.4);
    // The equator gets twelve hours all year.
    const eq = sunSummary(0);
    expect(eq.summerDayLength).toBeCloseTo(12, 0);
    expect(eq.winterDayLength).toBeCloseTo(12, 0);
  });

  it('produces roughly 10 kWh/m²/day at the top of the atmosphere on the equator', () => {
    expect(clearSkyDaily(0, 80)).toBeGreaterThan(9);
    expect(clearSkyDaily(0, 80)).toBeLessThan(11);
  });

  it('handles the polar night without producing nonsense', () => {
    expect(clearSkyDaily(80, DECEMBER_SOLSTICE)).toBe(0);
    expect(sunTrack(80, DECEMBER_SOLSTICE)).toHaveLength(0);
    expect(dayLengthMonthly(80).every((h) => h >= 0 && h <= 24)).toBe(true);
  });

  it('tracks the sun from east through to west', () => {
    const track = sunTrack(52, JUNE_SOLSTICE);
    expect(track.length).toBeGreaterThan(10);
    // Rises in the north-east, sets in the north-west at this latitude in June.
    expect(track[0].azimuth).toBeLessThan(90);
    expect(track[track.length - 1].azimuth).toBeGreaterThan(270);
    // Highest point is at the middle of the day.
    const peak = track.reduce((a, b) => (b.altitude > a.altitude ? b : a));
    expect(peak.altitude).toBeCloseTo(noonAltitude(52, JUNE_SOLSTICE), 0);
  });

  it('puts the midday sun in the north for a southern site', () => {
    const track = sunTrack(-33, DECEMBER_SOLSTICE);
    const peak = track.reduce((a, b) => (b.altitude > a.altitude ? b : a));
    expect(peak.azimuth < 45 || peak.azimuth > 315).toBe(true);
  });
});

describe('latitude and the climate preset', () => {
  it('keeps a preset roughly where it was at its own latitude', () => {
    for (const preset of CLIMATE_PRESETS) {
      const k = clearnessIndex(preset.peakSunHours, preset.refLatitude);
      const rebuilt = peakSunHoursAt(preset.refLatitude, k);
      const before = preset.peakSunHours.reduce((a, b) => a + b, 0);
      const after = rebuilt.reduce((a, b) => a + b, 0);
      expect(after).toBeCloseTo(before, 3);
      // Clearness should land in a physically sensible band.
      expect(k).toBeGreaterThan(0.2);
      expect(k).toBeLessThan(0.8);
    }
  });

  it('gives a sunny climate less sun when you move it north', () => {
    const med = siteFromPreset(getPreset('mediterranean'), DEFAULT_SITE);
    const moved = applyLatitude(med, 60);
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(sum(moved.peakSunHours)).toBeLessThan(sum(med.peakSunHours));
    // …but it stays sunnier than a grey climate at the same latitude.
    const oceanic = applyLatitude(siteFromPreset(getPreset('temperateOceanic'), DEFAULT_SITE), 60);
    expect(sum(moved.peakSunHours)).toBeGreaterThan(sum(oceanic.peakSunHours));
  });

  it('flips the seasons when you cross the equator', () => {
    const north = siteFromPreset(getPreset('mediterranean'), { ...DEFAULT_SITE, latitude: 38 });
    const south = applyLatitude(north, -38);
    // The wettest month moves half a year.
    const wettest = (xs: number[]) => xs.indexOf(Math.max(...xs));
    expect((wettest(north.rainfallShape) + 6) % 12).toBe(wettest(south.rainfallShape));
    // And the warmest month with it.
    expect((north.meanTempC.indexOf(Math.max(...north.meanTempC)) + 6) % 12)
      .toBe(south.meanTempC.indexOf(Math.max(...south.meanTempC)));
    // Sun peaks in the southern summer.
    expect(south.peakSunHours[0]).toBeGreaterThan(south.peakSunHours[6]);
  });

  it('does not flip the seasons for a move within one hemisphere', () => {
    const a = siteFromPreset(getPreset('coldContinental'), DEFAULT_SITE);
    const b = applyLatitude(a, 60);
    expect(b.meanTempC).toEqual(a.meanTempC);
    expect(b.rainfallShape).toEqual(a.rainfallShape);
  });
});

describe('slope', () => {
  it('makes an equator-facing slope behave like a lower latitude', () => {
    const flat = { ...DEFAULT_SITE, slopePercent: 0 };
    const facing = { ...DEFAULT_SITE, slopePercent: 20, slopeAspect: 180 };
    const away = { ...DEFAULT_SITE, slopePercent: 20, slopeAspect: 0 };
    expect(solarLatitude(facing)).toBeLessThan(solarLatitude(flat));
    expect(solarLatitude(away)).toBeGreaterThan(solarLatitude(flat));
    // A slope across the fall line is neutral.
    expect(solarLatitude({ ...DEFAULT_SITE, slopePercent: 20, slopeAspect: 90 }))
      .toBeCloseTo(solarLatitude(flat), 6);
  });

  it('flips which way is the good slope below the equator', () => {
    const south = applyLatitude(DEFAULT_SITE, -34);
    const facingNorth = solarLatitude({ ...south, slopePercent: 20, slopeAspect: 0 });
    const facingSouth = solarLatitude({ ...south, slopePercent: 20, slopeAspect: 180 });
    // Below the equator the sun is in the north, so a north-facing slope gains.
    expect(Math.abs(facingNorth)).toBeLessThan(Math.abs(facingSouth));
  });

  it('gives an equator-facing slope more winter sun', () => {
    const flat = applySlope(DEFAULT_SITE, 0, 180);
    const tilted = applySlope(DEFAULT_SITE, 25, 180);
    expect(tilted.peakSunHours[11]).toBeGreaterThan(flat.peakSunHours[11]);
  });

  it('sheds more water off steep clay than off flat sand', () => {
    const flatSand = { ...DEFAULT_SITE, soil: 'sand' as const, slopePercent: 0 };
    const steepClay = { ...DEFAULT_SITE, soil: 'clay' as const, slopePercent: 25 };
    expect(runoffFraction(steepClay)).toBeGreaterThan(runoffFraction(flatSand) * 2);
    expect(runoffFraction(steepClay)).toBeLessThanOrEqual(0.85);
  });

  it('raises irrigation demand on ground that sheds its rain', () => {
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const flat = buildDrivers({ ...DEFAULT_SITE, soil: 'sand', slopePercent: 0 });
    const steep = buildDrivers({ ...DEFAULT_SITE, soil: 'clay', slopePercent: 25 });
    expect(sum(steep.irrigationDemandPerM2)).toBeGreaterThan(sum(flat.irrigationDemandPerM2));
    expect(sum(steep.runoffMm)).toBeGreaterThan(sum(flat.runoffMm));
  });
});
