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
  const irrigationDemandPerM2 = site.etoMm.map((eto, i) => {
    // Only part of rainfall is usefully retained by a bed; the rest runs off.
    const effectiveRain = rainfallMm[i] * 0.75;
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
    heatingDegreeDays,
  };
}

export function siteFromPreset(preset: ClimatePreset, base: SiteProfile): SiteProfile {
  return {
    ...base,
    climate: preset.id,
    annualRainfallMm: preset.annualRainfallMm,
    rainfallShape: [...preset.rainfallShape],
    peakSunHours: [...preset.peakSunHours],
    meanTempC: [...preset.meanTempC],
    etoMm: [...preset.etoMm],
  };
}

export const DEFAULT_SITE: SiteProfile = {
  name: 'My yard',
  climate: 'temperateOceanic',
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
};
