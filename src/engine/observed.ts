/**
 * Real weather, in place of an archetype.
 *
 * A climate preset is a shape borrowed from somewhere that resembles you. An
 * observed record is your own ground: fifteen years of reanalysis averaged into
 * the twelve numbers the model reads. Same idea as the evidence tiers on
 * systems — where the number came from travels with the number.
 *
 * Payloads come from `tools/climate-fetch.html`, which does the fetching and
 * the averaging in a browser because this build environment cannot reach the
 * archive.
 */
import { clearSkyMonthly } from './solar';
import type { SiteProfile } from './types';

export interface ObservedClimate {
  latitude: number;
  longitude: number;
  years: [number, number];
  source: string;
  fetched: string;
  elevation?: number;
  timezone?: string;
  meanTempC: number[];
  rainfallMm: number[];
  etoMm: number[];
  peakSunHours: number[];
}

export interface ParseFailure { error: string }

const isTwelve = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length === 12 && v.every((n) => typeof n === 'number' && isFinite(n));

/**
 * Validate a payload from the fetch tool. Deliberately strict: a climate record
 * that is silently half-wrong is worse than one that is loudly rejected.
 */
export function parseObservedClimate(input: unknown): ObservedClimate | ParseFailure {
  if (typeof input === 'string') {
    try {
      return parseObservedClimate(JSON.parse(input));
    } catch {
      return { error: 'That is not valid JSON.' };
    }
  }
  if (!input || typeof input !== 'object') return { error: 'Expected a JSON object.' };
  const o = input as Record<string, unknown>;

  if (o.mmssimClimate !== 1) {
    return { error: 'This does not look like output from the climate fetch tool.' };
  }
  if (Array.isArray(o.missing) && o.missing.length > 0) {
    return { error: `The fetch was incomplete — missing ${(o.missing as string[]).join(', ')}.` };
  }
  for (const key of ['meanTempC', 'rainfallMm', 'etoMm', 'peakSunHours'] as const) {
    if (!isTwelve(o[key])) return { error: `${key} must be twelve numbers.` };
  }
  const lat = Number(o.latitude);
  if (!isFinite(lat) || Math.abs(lat) > 90) return { error: 'Latitude is missing or out of range.' };

  const rain = (o.rainfallMm as number[]).reduce((a, b) => a + b, 0);
  if (rain <= 0 || rain > 12000) return { error: `An annual rainfall of ${Math.round(rain)} mm is not credible.` };
  if ((o.peakSunHours as number[]).some((v) => v < 0 || v > 12)) {
    return { error: 'Sun hours per day are out of range.' };
  }

  const years = Array.isArray(o.years) && o.years.length === 2
    ? [Number(o.years[0]), Number(o.years[1])] as [number, number]
    : [0, 0] as [number, number];

  return {
    latitude: lat,
    longitude: Number(o.longitude) || 0,
    years,
    source: typeof o.source === 'string' ? o.source : 'unknown',
    fetched: typeof o.fetched === 'string' ? o.fetched : '',
    elevation: typeof o.elevation === 'number' ? o.elevation : undefined,
    timezone: typeof o.timezone === 'string' ? o.timezone : undefined,
    meanTempC: o.meanTempC as number[],
    rainfallMm: o.rainfallMm as number[],
    etoMm: o.etoMm as number[],
    peakSunHours: o.peakSunHours as number[],
  };
}

/** A short human label for where a site's weather came from. */
export function describeObserved(o: ObservedClimate): string {
  const span = o.years[0] && o.years[1] ? `${o.years[0]}–${o.years[1]}` : 'recent years';
  return `Observed ${span}`;
}

/**
 * Attach an observed record to a site.
 *
 * The monthly series are taken verbatim — that is the whole point — and the
 * latitude moves to where the data was actually measured. The observed sun
 * series is kept as the baseline so that later changes to latitude or slope
 * scale it rather than replace it: a real cloud seasonality survives being
 * tilted or moved, which a smooth clear-sky curve would not.
 */
export function applyObservedClimate(site: SiteProfile, o: ObservedClimate): SiteProfile {
  const annualRainfallMm = o.rainfallMm.reduce((a, b) => a + b, 0);
  return {
    ...site,
    climate: 'custom',
    latitude: o.latitude,
    longitude: o.longitude,
    annualRainfallMm,
    rainfallShape: o.rainfallMm.map((mm) => mm / annualRainfallMm),
    meanTempC: [...o.meanTempC],
    etoMm: [...o.etoMm],
    peakSunHours: [...o.peakSunHours],
    observedPeakSunHours: [...o.peakSunHours],
    observedLatitude: o.latitude,
    climateSource: 'observed',
    climateLabel: describeObserved(o),
    climateProvenance: `${o.source}${o.elevation !== undefined ? ` · ${o.elevation} m` : ''}`,
    climateYears: o.years,
  };
}

/**
 * How much of the clear-sky maximum actually reaches this ground. Derived from
 * the observed record where there is one, so a site that has been measured
 * keeps its own cloudiness when it is tilted or nudged.
 */
export function observedClearness(o: ObservedClimate): number {
  const clear = clearSkyMonthly(o.latitude).reduce((a, b) => a + b, 0);
  const actual = o.peakSunHours.reduce((a, b) => a + b, 0);
  return clear > 0 ? actual / clear : 0.5;
}
