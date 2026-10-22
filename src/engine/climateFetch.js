const ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive';
/** The daily variables the model needs. Confirmed present in a live response. */
export const DAILY_VARIABLES = [
    'temperature_2m_mean',
    'precipitation_sum',
    'et0_fao_evapotranspiration',
    'shortwave_radiation_sum',
];
export class ClimateFetchError extends Error {
}
export function buildArchiveUrl(latitude, longitude, fromYear, toYear) {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        start_date: `${fromYear}-01-01`,
        end_date: `${toYear}-12-31`,
        daily: DAILY_VARIABLES.join(','),
        timezone: 'auto',
    });
    return `${ENDPOINT}?${params}`;
}
/** Great-circle distance, kilometres. Only ever used over a few grid cells. */
export function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
/**
 * Average a daily series into the twelve monthly figures the model reads.
 *
 * Temperature is a mean of daily means; rain and evapotranspiration are
 * monthly totals averaged across the years present; sun is a daily mean of
 * shortwave radiation, converted from MJ to kWh — 3.6 MJ is one kilowatt-hour,
 * which is one peak sun hour.
 */
export function aggregateDaily(raw, asked) {
    if (raw.error)
        throw new ClimateFetchError(raw.reason || 'The archive refused the request.');
    const daily = raw.daily;
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
        throw new ClimateFetchError('The archive returned no daily data for that point.');
    }
    const time = daily.time;
    const missing = DAILY_VARIABLES.filter((k) => !Array.isArray(daily[k]));
    if (missing.length) {
        throw new ClimateFetchError(`The archive did not return ${missing.join(', ')}.`);
    }
    const series = (k) => daily[k];
    const sums = {};
    for (const k of DAILY_VARIABLES)
        sums[k] = new Array(12).fill(0);
    const days = new Array(12).fill(0);
    const years = Array.from({ length: 12 }, () => new Set());
    for (let i = 0; i < time.length; i++) {
        const stamp = time[i];
        const m = Number(stamp.slice(5, 7)) - 1;
        if (m < 0 || m > 11)
            continue;
        days[m] += 1;
        years[m].add(stamp.slice(0, 4));
        for (const k of DAILY_VARIABLES) {
            const v = series(k)[i];
            if (typeof v === 'number' && isFinite(v))
                sums[k][m] += v;
        }
    }
    if (days.some((d) => d === 0)) {
        throw new ClimateFetchError('The archive returned an incomplete year.');
    }
    // Report the span the data actually covers rather than the one requested —
    // if the archive returns less than was asked for, the label should say so.
    const allYears = new Set();
    for (const set of years)
        for (const y of set)
            allYears.add(y);
    const sorted = [...allYears].map(Number).sort((a, b) => a - b);
    const span = sorted.length
        ? [sorted[0], sorted[sorted.length - 1]]
        : [asked.fromYear, asked.toYear];
    const perDay = (k, m) => sums[k][m] / days[m];
    const perMonth = (k, m) => sums[k][m] / Math.max(1, years[m].size);
    const round = (v, dp) => Number(v.toFixed(dp));
    const climate = {
        latitude: asked.latitude,
        longitude: asked.longitude,
        years: span,
        source: 'Open-Meteo ERA5 archive (CC-BY-4.0)',
        fetched: new Date().toISOString().slice(0, 10),
        ...(typeof raw.elevation === 'number' ? { elevation: raw.elevation } : {}),
        ...(raw.timezone ? { timezone: raw.timezone } : {}),
        meanTempC: Array.from({ length: 12 }, (_, m) => round(perDay('temperature_2m_mean', m), 1)),
        rainfallMm: Array.from({ length: 12 }, (_, m) => round(perMonth('precipitation_sum', m), 1)),
        etoMm: Array.from({ length: 12 }, (_, m) => round(perMonth('et0_fao_evapotranspiration', m), 1)),
        peakSunHours: Array.from({ length: 12 }, (_, m) => round(perDay('shortwave_radiation_sum', m) / 3.6, 2)),
    };
    const gridOffsetKm = typeof raw.latitude === 'number' && typeof raw.longitude === 'number'
        ? distanceKm(asked.latitude, asked.longitude, raw.latitude, raw.longitude)
        : 0;
    return { climate, gridOffsetKm };
}
/** Fetch and average. Throws `ClimateFetchError` with something worth showing. */
export async function fetchClimate(latitude, longitude, opts = {}) {
    const toYear = opts.toYear ?? new Date().getFullYear() - 1;
    const fromYear = opts.fromYear ?? toYear - 14;
    let res;
    try {
        res = await fetch(buildArchiveUrl(latitude, longitude, fromYear, toYear), {
            signal: opts.signal ?? null,
        });
    }
    catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError')
            throw e;
        throw new ClimateFetchError('Could not reach the weather archive. Check the connection, or use the offline tool in tools/climate-fetch.html.');
    }
    if (!res.ok) {
        let reason = `The archive answered ${res.status}.`;
        try {
            const body = await res.json();
            if (body?.reason)
                reason = body.reason;
        }
        catch { /* keep the status line */ }
        throw new ClimateFetchError(reason);
    }
    const raw = await res.json();
    return aggregateDaily(raw, { latitude, longitude, fromYear, toYear });
}
