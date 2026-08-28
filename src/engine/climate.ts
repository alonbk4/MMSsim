import { clearnessIndex, peakSunHoursAt } from './solar';
import type { ClimatePresetId, DriverId, SiteProfile } from './types';

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface ClimatePreset {
  id: ClimatePresetId;
  label: string;
  blurb: string;
  /** The latitude this preset's sun figures were written for. */
  refLatitude: number;
  annualRainfallMm: number;
  /** Fractions of annual rain, summing to 1. */
  rainfallShape: number[];
  peakSunHours: number[];
  meanTempC: number[];
  etoMm: number[];
}

/**
 * Northern-hemisphere shapes. Southern-hemisphere sites use the same presets
 * with the series rotated six months — see `shiftHemisphere`.
 */
export const CLIMATE_PRESETS: ClimatePreset[] = [
  {
    id: 'mediterranean',
    refLatitude: 38,
    label: 'Mediterranean',
    blurb: 'Wet cool winter, hot bone-dry summer. Storage is everything here.',
    annualRainfallMm: 550,
    rainfallShape: [0.17, 0.15, 0.12, 0.07, 0.03, 0.01, 0.004, 0.006, 0.03, 0.09, 0.14, 0.18],
    peakSunHours: [2.4, 3.2, 4.4, 5.6, 6.6, 7.3, 7.5, 6.9, 5.5, 4.0, 2.7, 2.2],
    meanTempC: [9, 10, 12, 15, 19, 23, 26, 26, 23, 18, 13, 10],
    etoMm: [30, 40, 65, 95, 130, 160, 180, 165, 120, 80, 42, 27],
  },
  {
    id: 'temperateOceanic',
    refLatitude: 52,
    label: 'Temperate oceanic',
    blurb: 'Rain spread through the year, mild, low summer sun. Water is easy, sun is not.',
    annualRainfallMm: 850,
    rainfallShape: [0.10, 0.08, 0.08, 0.07, 0.07, 0.07, 0.07, 0.08, 0.08, 0.10, 0.10, 0.10],
    peakSunHours: [1.0, 1.7, 2.8, 4.0, 4.9, 5.1, 4.9, 4.2, 3.1, 1.9, 1.1, 0.8],
    meanTempC: [5, 5, 7, 10, 13, 16, 18, 18, 15, 12, 8, 6],
    etoMm: [12, 18, 35, 55, 80, 92, 95, 82, 55, 32, 15, 10],
  },
  {
    id: 'humidSubtropical',
    refLatitude: 34,
    label: 'Humid subtropical',
    blurb: 'Warm and wet, long growing season, high evaporation and mould pressure.',
    annualRainfallMm: 1200,
    rainfallShape: [0.07, 0.07, 0.09, 0.08, 0.09, 0.10, 0.11, 0.11, 0.09, 0.07, 0.06, 0.06],
    peakSunHours: [2.6, 3.3, 4.3, 5.3, 5.8, 5.9, 5.7, 5.4, 4.6, 3.9, 2.9, 2.4],
    meanTempC: [8, 10, 14, 19, 23, 27, 28, 28, 25, 19, 14, 9],
    etoMm: [35, 45, 75, 105, 130, 145, 150, 140, 105, 75, 45, 33],
  },
  {
    id: 'coldContinental',
    refLatitude: 47,
    label: 'Cold continental',
    blurb: 'Hard winter, short intense growing season. Season extension and storage dominate.',
    annualRainfallMm: 700,
    rainfallShape: [0.05, 0.05, 0.07, 0.08, 0.11, 0.12, 0.11, 0.10, 0.09, 0.08, 0.07, 0.07],
    peakSunHours: [1.6, 2.5, 3.6, 4.6, 5.4, 5.8, 5.7, 5.0, 3.8, 2.5, 1.5, 1.2],
    meanTempC: [-8, -6, 0, 8, 15, 20, 22, 21, 16, 9, 1, -5],
    etoMm: [5, 8, 25, 60, 100, 125, 135, 115, 70, 35, 12, 5],
  },
  {
    id: 'aridDesert',
    refLatitude: 30,
    label: 'Arid / desert',
    blurb: 'Very little rain, brutal evaporation, abundant sun. Every litre is designed for.',
    annualRainfallMm: 180,
    rainfallShape: [0.13, 0.12, 0.09, 0.05, 0.02, 0.01, 0.06, 0.10, 0.08, 0.07, 0.10, 0.17],
    peakSunHours: [3.6, 4.6, 5.8, 7.0, 7.8, 8.1, 7.6, 7.2, 6.4, 5.2, 4.0, 3.3],
    meanTempC: [12, 15, 19, 24, 29, 34, 36, 35, 31, 24, 17, 12],
    etoMm: [55, 75, 120, 165, 210, 235, 230, 210, 165, 115, 70, 50],
  },
  {
    id: 'tropicalWetDry',
    refLatitude: 13,
    label: 'Tropical wet & dry',
    blurb: 'A monsoon you must catch and a dry season you must survive.',
    annualRainfallMm: 1400,
    rainfallShape: [0.01, 0.01, 0.02, 0.05, 0.11, 0.17, 0.19, 0.18, 0.13, 0.08, 0.03, 0.02],
    peakSunHours: [5.6, 6.0, 6.1, 5.8, 5.2, 4.4, 4.2, 4.4, 4.9, 5.4, 5.6, 5.5],
    meanTempC: [24, 26, 28, 29, 28, 26, 25, 25, 26, 26, 25, 24],
    etoMm: [120, 130, 150, 150, 135, 110, 100, 100, 110, 125, 120, 115],
  },
];

export function getPreset(id: ClimatePresetId): ClimatePreset {
  return CLIMATE_PRESETS.find((p) => p.id === id) ?? CLIMATE_PRESETS[0];
}

/** Rotate a 12-month series by six months, for southern-hemisphere sites. */
export function shiftHemisphere(series: number[]): number[] {
  return series.map((_, i) => series[(i + 6) % 12]);
}

export type DriverSeries = Record<DriverId, number[]>;

/**
 * The latitude the *sun* effectively sees, once the ground is tilted.
 *
 * A slope leaning toward the equator gathers light as though it were that many
 * degrees closer to it; one leaning away loses the same. This is the standard
 * rule of thumb rather than a full tilted-plane calculation — good to a few
 * percent at yard scale, and it keeps a single number driving the whole model.
 */
export function solarLatitude(site: SiteProfile): number {
  const slopeDeg = Math.atan(site.slopePercent / 100) * (180 / Math.PI);
  const towardEquator = site.latitude >= 0 ? 180 : 0;
  const alignment = Math.cos((site.slopeAspect - towardEquator) * (Math.PI / 180));
  // The shift is always *towards* the equator when the slope faces it, which
  // means subtracting in the north and adding in the south — the effective
  // latitude has to move toward zero either way, not just get smaller.
  const hemisphere = site.latitude >= 0 ? 1 : -1;
  return Math.max(-80, Math.min(80, site.latitude - hemisphere * slopeDeg * alignment));
}

/**
 * The share of rain that runs off rather than soaking in. Clay sheds, sand
 * drinks, and every degree of slope moves water sideways before it can do
 * either. This is what swales are built to intercept.
 */
export function runoffFraction(site: SiteProfile): number {
  const bySoil = { sand: 0.12, loam: 0.24, clay: 0.4 }[site.soil];
  return Math.min(0.85, bySoil + Math.min(0.35, site.slopePercent * 0.012));
}

/**
 * Turn a site profile into the monthly climate series the flow model reads.
 *
 * The two derived ones worth explaining:
 *
 * - `growingShare` distributes a year's plant growth across the months using
 *   mean temperature: nothing below 5 °C, ramping to full through 18 °C, and
 *   backing off above 30 °C where most annual crops stall. It is normalised so
 *   the twelve values sum to 1, which lets a catalog entry state a plain
 *   annual yield and still respond to a short or long season.
 *
 * - `irrigationDemandPerM2` is reference ET scaled by a mid-season crop factor,
 *   less the rain that actually lands on the bed, floored at zero. 1 mm over
 *   1 m² is 1 litre, so the number is directly litres per m² of bed.
 */
export function buildDrivers(site: SiteProfile): DriverSeries {
  const rainfallMm = site.rainfallShape.map((f) => f * site.annualRainfallMm);

  const growthWeight = site.meanTempC.map((t, i) => {
    let w: number;
    if (t <= 5) w = 0;
    else if (t < 18) w = (t - 5) / 13;
    else if (t <= 30) w = 1;
    else w = Math.max(0, 1 - (t - 30) / 12);
    return w * DAYS_IN_MONTH[i];
  });
  const growthTotal = growthWeight.reduce((a, b) => a + b, 0);
  const growingShare =
    growthTotal > 0 ? growthWeight.map((w) => w / growthTotal) : DAYS_IN_MONTH.map(() => 1 / 12);

  const CROP_FACTOR = 0.85;
  const runoff = runoffFraction(site);
  const runoffMm = rainfallMm.map((r) => r * runoff);
  const irrigationDemandPerM2 = site.etoMm.map((eto, i) => {
    // Rain that runs off never reaches the roots, so a steep clay site needs
    // more irrigation than a flat sandy one under identical weather.
    const effectiveRain = rainfallMm[i] - runoffMm[i];
    return Math.max(0, eto * CROP_FACTOR - effectiveRain);
  });

  const heatingDegreeDays = site.meanTempC.map((t, i) =>
    Math.max(0, 18 - t) * DAYS_IN_MONTH[i],
  );

  return {
    daysInMonth: [...DAYS_IN_MONTH],
    rainfallMm,
    peakSunHours: site.peakSunHours.map((h, i) => h * DAYS_IN_MONTH[i]),
    growingShare,
    irrigationDemandPerM2,
    runoffMm,
    heatingDegreeDays,
  };
}

export function siteFromPreset(preset: ClimatePreset, base: SiteProfile): SiteProfile {
  const southern = base.latitude < 0;
  const flip = (xs: number[]) => (southern ? shiftHemisphere(xs) : [...xs]);
  const next: SiteProfile = {
    ...base,
    climate: preset.id,
    annualRainfallMm: preset.annualRainfallMm,
    rainfallShape: flip(preset.rainfallShape),
    peakSunHours: [...preset.peakSunHours],
    meanTempC: flip(preset.meanTempC),
    etoMm: flip(preset.etoMm),
  };
  // Picking a climate also moves you to where that climate is — otherwise
  // choosing "Arid / desert" while sitting at 60°N quietly keeps northern sun
  // angles. The hemisphere you are in is preserved.
  const hemisphere = base.latitude < 0 ? -1 : 1;
  return applyLatitude(next, hemisphere * preset.refLatitude);
}

/**
 * Move the site to a latitude and recompute what the sun does there.
 *
 * The climate preset knows how cloudy a place is; latitude knows how much sun
 * is available to be blocked. Holding the preset's clearness and recomputing
 * from geometry is what lets "Mediterranean at 55°N" mean a sunny climate with
 * a northern sun angle, rather than silently keeping Andalusian sun-hours.
 *
 * Crossing the equator flips the seasonal series, since a January in Chile is
 * not a January in Spain.
 */
/** Recompute the sun series for whatever latitude and slope the site now has. */
export function recomputeSun(site: SiteProfile): SiteProfile {
  const preset = CLIMATE_PRESETS.find((p) => p.id === site.climate);
  const clearness = preset
    ? clearnessIndex(preset.peakSunHours, preset.refLatitude)
    : clearnessIndex(site.peakSunHours, site.latitude || 45);
  return { ...site, peakSunHours: peakSunHoursAt(solarLatitude(site), clearness) };
}

/** Set the slope and re-derive everything that leans on it. */
export function applySlope(
  site: SiteProfile, slopePercent: number, slopeAspect: number,
): SiteProfile {
  return recomputeSun({
    ...site,
    slopePercent: Math.max(0, Math.min(45, slopePercent)),
    slopeAspect: ((slopeAspect % 360) + 360) % 360,
  });
}

export function applyLatitude(site: SiteProfile, latitude: number): SiteProfile {
  const lat = Math.max(-66, Math.min(66, latitude));
  const preset = CLIMATE_PRESETS.find((p) => p.id === site.climate);
  const clearness = preset
    ? clearnessIndex(preset.peakSunHours, preset.refLatitude)
    : clearnessIndex(site.peakSunHours, site.latitude || 45);

  const crossedEquator = Math.sign(lat || 1) !== Math.sign(site.latitude || 1);
  const flip = (xs: number[]) => (crossedEquator ? shiftHemisphere(xs) : xs);

  return recomputeSun({
    ...site,
    latitude: lat,
    peakSunHours: peakSunHoursAt(lat, clearness),
    rainfallShape: flip(site.rainfallShape),
    meanTempC: flip(site.meanTempC),
    etoMm: flip(site.etoMm),
  });
}

const BASE_SITE: SiteProfile = {
  name: 'My yard',
  climate: 'temperateOceanic',
  latitude: 52,
  annualRainfallMm: 850,
  rainfallShape: [...CLIMATE_PRESETS[1].rainfallShape],
  peakSunHours: [...CLIMATE_PRESETS[1].peakSunHours],
  meanTempC: [...CLIMATE_PRESETS[1].meanTempC],
  etoMm: [...CLIMATE_PRESETS[1].etoMm],
  lotAreaM2: 600,
  lotWidthM: 20,
  roofAreaM2: 90,
  houseX: 0.5,
  houseY: 0.5,
  household: 3,
  waterUsePerPersonLPerDay: 120,
  electricityPerPersonKwhPerDay: 4,
  caloriesPerPersonPerDay: 2200,
  proteinPerPersonKgPerMonth: 1.6,
  greywaterFraction: 0.55,
  soil: 'loam',
  slopePercent: 4,
  slopeAspect: 180,
  houseHeightM: 6,
};

/**
 * Derived rather than written down, so the starting site's sun figures are
 * exactly what its latitude produces. Otherwise nudging the latitude slider by
 * a degree would visibly jump the whole curve.
 */
export const DEFAULT_SITE: SiteProfile = applyLatitude(BASE_SITE, BASE_SITE.latitude);
