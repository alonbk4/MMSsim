import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  aggregateDaily, buildArchiveUrl, ClimateFetchError, distanceKm, fetchClimate,
} from './climateFetch';
import { ANN_ARBOR } from './data/observed/ann-arbor';

/** Synthetic daily data with answers worked out by hand. */
function synth(opts: { years?: number[]; swradMJ?: number; gridLat?: number } = {}) {
  const years = opts.years ?? [2023, 2024];
  const time: string[] = [];
  const temp: number[] = [], pr: number[] = [], et: number[] = [], sw: number[] = [];
  for (const y of years) {
    for (let m = 1; m <= 12; m++) {
      const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let d = 1; d <= dim; d++) {
        time.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        temp.push(m); pr.push(1); et.push(2); sw.push(opts.swradMJ ?? 3.6);
      }
    }
  }
  return {
    latitude: opts.gridLat ?? 42.25, longitude: -83.75, elevation: 270,
    timezone: 'America/Detroit',
    daily: {
      time, temperature_2m_mean: temp, precipitation_sum: pr,
      et0_fao_evapotranspiration: et, shortwave_radiation_sum: sw,
    },
  };
}

const asked = { latitude: 42.27, longitude: -83.73, fromYear: 2023, toYear: 2024 };

describe('building the request', () => {
  it('asks for what the model needs, and nothing else', () => {
    const url = buildArchiveUrl(42.27, -83.73, 2010, 2024);
    expect(url).toContain('archive-api.open-meteo.com');
    expect(url).toContain('start_date=2010-01-01');
    expect(url).toContain('end_date=2024-12-31');
    for (const v of ['temperature_2m_mean', 'precipitation_sum',
      'et0_fao_evapotranspiration', 'shortwave_radiation_sum']) {
      expect(decodeURIComponent(url)).toContain(v);
    }
  });
});

describe('averaging the daily series', () => {
  it('reproduces figures worked out by hand', () => {
    const { climate } = aggregateDaily(synth(), asked);
    // Temperature was set to the month number.
    expect(climate.meanTempC).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    // 1 mm a day, so a month's total is its number of days (2024 is a leap year).
    expect(climate.rainfallMm[0]).toBeCloseTo(31, 1);
    expect(climate.rainfallMm[1]).toBeCloseTo(28.5, 1);
    // 2 mm a day of ET.
    expect(climate.etoMm[0]).toBeCloseTo(62, 1);
    // 3.6 MJ is exactly one kilowatt-hour, so exactly one peak sun hour.
    expect(climate.peakSunHours.every((v) => v === 1)).toBe(true);
  });

  it('scales sun hours with radiation', () => {
    const { climate } = aggregateDaily(synth({ swradMJ: 18 }), asked);
    expect(climate.peakSunHours.every((v) => v === 5)).toBe(true);
  });

  it('keeps the coordinates that were asked for, not the grid cell', () => {
    const { climate } = aggregateDaily(synth(), asked);
    expect(climate.latitude).toBe(42.27);
    expect(climate.longitude).toBe(-83.73);
  });

  it('reports how far the grid cell sits from the point named', () => {
    // Same place: no offset worth mentioning.
    const near = aggregateDaily(synth({ gridLat: 42.27 }), asked);
    expect(near.gridOffsetKm).toBeLessThan(3);
    // Half a degree of latitude is about 55 km.
    const far = aggregateDaily(synth({ gridLat: 42.77 }), asked);
    expect(far.gridOffsetKm).toBeGreaterThan(50);
    expect(far.gridOffsetKm).toBeLessThan(60);
  });

  it('reports the years the data actually covers, not the ones requested', () => {
    // Asked for 2023-2024 but only 2023 came back: the label must not claim two.
    const { climate } = aggregateDaily(synth({ years: [2023] }), asked);
    expect(climate.years).toEqual([2023, 2023]);
  });

  it('carries provenance', () => {
    const { climate } = aggregateDaily(synth(), asked);
    expect(climate.source).toContain('Open-Meteo');
    expect(climate.years).toEqual([2023, 2024]);
    expect(climate.elevation).toBe(270);
    expect(climate.fetched).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('refuses a response that is missing what it needs', () => {
    const bad = synth() as Record<string, any>;
    delete bad.daily.et0_fao_evapotranspiration;
    expect(() => aggregateDaily(bad, asked)).toThrow(/et0_fao_evapotranspiration/);
  });

  it('refuses an error payload and repeats its reason', () => {
    expect(() => aggregateDaily(
      { error: true, reason: 'Invalid date range' }, asked,
    )).toThrow(/Invalid date range/);
  });

  it('refuses an empty or partial year', () => {
    expect(() => aggregateDaily({ daily: { time: [] } }, asked)).toThrow(/no daily data/);
    const partial = synth();
    // Chop everything after March.
    const keep = partial.daily.time.filter((t) => Number(t.slice(5, 7)) <= 3).length;
    partial.daily.time = partial.daily.time.slice(0, keep);
    expect(() => aggregateDaily(partial, asked)).toThrow(/incomplete year/);
  });
});

describe('distance', () => {
  it('measures a known separation', () => {
    // Ann Arbor to Detroit is about 50 km.
    const d = distanceKm(42.27, -83.73, 42.37, -83.10);
    expect(d).toBeGreaterThan(45);
    expect(d).toBeLessThan(60);
  });
});

describe('fetching', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns a usable record from a well-formed response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200, json: async () => synth(),
    })));
    const { climate } = await fetchClimate(42.27, -83.73, { fromYear: 2023, toYear: 2024 });
    expect(climate.meanTempC).toHaveLength(12);
    expect(climate.peakSunHours[0]).toBe(1);
  });

  it('explains a network failure instead of throwing something raw', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(fetchClimate(42, -83)).rejects.toThrow(ClimateFetchError);
    await expect(fetchClimate(42, -83)).rejects.toThrow(/Could not reach|offline tool/);
  });

  it('surfaces the archive\'s own reason for a rejection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false, status: 400, json: async () => ({ error: true, reason: 'Longitude must be in range' }),
    })));
    await expect(fetchClimate(42, -999)).rejects.toThrow(/Longitude must be in range/);
  });

  it('falls back to the status line when the body says nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false, status: 503, json: async () => { throw new Error('not json'); },
    })));
    await expect(fetchClimate(42, -83)).rejects.toThrow(/503/);
  });

  it('produces something close to the record we already hold', async () => {
    // A crude sanity harness: feed the shipped Ann Arbor figures back through
    // as if they were daily data, and check the round trip lands where it started.
    const days: string[] = [], temp: number[] = [], pr: number[] = [],
      et: number[] = [], sw: number[] = [];
    for (let m = 0; m < 12; m++) {
      const dim = new Date(Date.UTC(2023, m + 1, 0)).getUTCDate();
      for (let d = 1; d <= dim; d++) {
        days.push(`2023-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        temp.push(ANN_ARBOR.meanTempC[m]);
        pr.push(ANN_ARBOR.rainfallMm[m] / dim);
        et.push(ANN_ARBOR.etoMm[m] / dim);
        sw.push(ANN_ARBOR.peakSunHours[m] * 3.6);
      }
    }
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200,
      json: async () => ({ latitude: 42.27, longitude: -83.73, elevation: 270,
        daily: { time: days, temperature_2m_mean: temp, precipitation_sum: pr,
          et0_fao_evapotranspiration: et, shortwave_radiation_sum: sw } }),
    })));
    const { climate } = await fetchClimate(42.27, -83.73, { fromYear: 2023, toYear: 2023 });
    for (let m = 0; m < 12; m++) {
      expect(climate.meanTempC[m]).toBeCloseTo(ANN_ARBOR.meanTempC[m], 1);
      expect(climate.rainfallMm[m]).toBeCloseTo(ANN_ARBOR.rainfallMm[m], 0);
      expect(climate.peakSunHours[m]).toBeCloseTo(ANN_ARBOR.peakSunHours[m], 1);
    }
  });
});
