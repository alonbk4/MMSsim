/**
 * Built-in typical weather, so a ZIP code sets the climate as well as the sun.
 *
 * The table is NASA POWER's climatology for every grid cell the bundled ZIP
 * table lands in (see scripts/build-climate-normals.mjs). It is loaded on
 * demand — a separate chunk the service worker precaches — so the first paint
 * does not pay for weather nobody has asked for yet, and it still works with
 * the aeroplane mode on.
 *
 * The record it returns is placed at the point that was asked for, not at the
 * cell centre: the cell is the resolution of the weather, not the location of
 * the yard, and moving the site half a cell would move its sun for no reason.
 */
import { distanceKm } from './climateFetch';
export const NORMALS_SOURCE = 'NASA POWER climatology (MERRA-2, CERES), built in';
/**
 * Past this the nearest cell is describing somewhere else — another valley,
 * another coast — and the honest answer is "no built-in weather here".
 */
export const NORMALS_MAX_KM = 120;
/** Decode the generated table. Pure, so it can be tested on a literal. */
export function parseNormals(table) {
    const cells = [];
    for (const line of table.split('\n')) {
        const v = line.trim().split(/\s+/).map(Number);
        if (v.length !== 51 || v.some((n) => !Number.isFinite(n)))
            continue;
        const twelve = (from, scale) => v.slice(from, from + 12).map((n) => n / scale);
        cells.push({
            latitude: v[0],
            longitude: v[1],
            elevation: v[2],
            meanTempC: twelve(3, 10),
            rainfallMm: twelve(15, 1),
            etoMm: twelve(27, 1),
            peakSunHours: twelve(39, 100),
        });
    }
    return cells;
}
/** The nearest cell to a point, or null when nothing is close enough. */
export function nearestCell(cells, latitude, longitude) {
    let best = null;
    let bestKm = Infinity;
    for (const c of cells) {
        // Cheap reject before the trigonometry: a degree is never under ~50 km
        // of longitude in the area this covers.
        if (Math.abs(c.latitude - latitude) > 3 || Math.abs(c.longitude - longitude) > 4)
            continue;
        const km = distanceKm(latitude, longitude, c.latitude, c.longitude);
        if (km < bestKm) {
            best = c;
            bestKm = km;
        }
    }
    return best && bestKm <= NORMALS_MAX_KM ? { cell: best, km: bestKm } : null;
}
export function climateFromCell(cell, latitude, longitude, years, built) {
    return {
        latitude,
        longitude,
        years,
        source: NORMALS_SOURCE,
        fetched: built,
        elevation: cell.elevation,
        meanTempC: [...cell.meanTempC],
        rainfallMm: [...cell.rainfallMm],
        etoMm: [...cell.etoMm],
        peakSunHours: [...cell.peakSunHours],
    };
}
let cache = null;
function load() {
    cache ??= import('./data/climate-normals').then((m) => ({
        cells: parseNormals(m.NORMALS_TABLE),
        years: m.NORMALS_YEARS,
        built: m.NORMALS_BUILT,
    })).catch((e) => {
        // A failed chunk load (offline before it was ever cached) should be
        // retryable next time, not remembered.
        cache = null;
        throw e;
    });
    return cache;
}
/** Typical weather for a point, or null outside the built-in coverage. */
export async function findNormals(latitude, longitude) {
    const { cells, years, built } = await load();
    const hit = nearestCell(cells, latitude, longitude);
    if (!hit)
        return null;
    return {
        climate: climateFromCell(hit.cell, latitude, longitude, years, built),
        gridOffsetKm: hit.km,
    };
}
/**
 * A saved record closer than this is the same ground as far as weather goes,
 * and it beats the built-in table: it is whatever the user fetched or
 * measured, usually on a finer grid.
 */
export const SAVED_RADIUS_KM = 30;
/** Decide what weather a newly located site should run on. */
export function pickWeather(latitude, longitude, saved, normals) {
    let best = null;
    let bestKm = Infinity;
    for (const r of saved) {
        const km = distanceKm(latitude, longitude, r.latitude, r.longitude);
        if (km < bestKm) {
            best = r;
            bestKm = km;
        }
    }
    if (best && bestKm <= SAVED_RADIUS_KM)
        return { kind: 'saved', record: best, km: bestKm };
    if (normals)
        return { kind: 'normals', hit: normals };
    return { kind: 'none' };
}
