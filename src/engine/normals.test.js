import { describe, expect, it } from 'vitest';
import { ANN_ARBOR } from './data/observed/ann-arbor';
import { NORMALS_TABLE, NORMALS_YEARS } from './data/climate-normals';
import { ZIP_CENTROIDS } from './data/zip-centroids';
import { lookupZip } from './location';
import { findNormals, nearestCell, NORMALS_MAX_KM, parseNormals, pickWeather, SAVED_RADIUS_KM, } from './normals';
import { parseObservedClimate } from './observed';
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const cells = parseNormals(NORMALS_TABLE);
describe('the built-in weather table', () => {
    it('decodes every row it ships', () => {
        const rows = NORMALS_TABLE.trim().split('\n');
        expect(cells.length).toBe(rows.length);
        expect(cells.length).toBeGreaterThan(900);
    });
    it('holds only weather that could exist', () => {
        for (const c of cells) {
            expect(c.meanTempC.every((t) => t > -40 && t < 45)).toBe(true);
            expect(sum(c.rainfallMm)).toBeGreaterThan(30);
            expect(sum(c.rainfallMm)).toBeLessThan(6000);
            expect(c.etoMm.every((e) => e >= 0 && e < 350)).toBe(true);
            expect(c.peakSunHours.every((h) => h >= 0 && h <= 9)).toBe(true);
        }
    });
    it('covers every ZIP prefix the app can resolve', () => {
        // A ZIP that finds a latitude but no weather would be a quiet half-answer.
        const uncovered = Object.entries(ZIP_CENTROIDS)
            .filter(([, [lat, lon]]) => !nearestCell(cells, lat, lon))
            .map(([zip]) => zip);
        expect(uncovered).toEqual([]);
        // And the cell found is the one the ZIP sits in, not a neighbour's.
        const loc = lookupZip('48104');
        expect(nearestCell(cells, loc.latitude, loc.longitude).km).toBeLessThan(40);
    });
    it('agrees with the measured Ann Arbor record about Ann Arbor', () => {
        // Different reanalysis, different grid, different years — so close, not equal.
        const hit = nearestCell(cells, ANN_ARBOR.latitude, ANN_ARBOR.longitude);
        expect(hit).not.toBeNull();
        const rain = sum(hit.cell.rainfallMm);
        const eto = sum(hit.cell.etoMm);
        expect(Math.abs(rain - sum(ANN_ARBOR.rainfallMm)) / sum(ANN_ARBOR.rainfallMm)).toBeLessThan(0.15);
        expect(Math.abs(eto - sum(ANN_ARBOR.etoMm)) / sum(ANN_ARBOR.etoMm)).toBeLessThan(0.15);
        expect(Math.abs(hit.cell.meanTempC[6] - ANN_ARBOR.meanTempC[6])).toBeLessThan(2);
        expect(Math.abs(hit.cell.meanTempC[0] - ANN_ARBOR.meanTempC[0])).toBeLessThan(2);
    });
    it('tells a desert from a rainforest coast', () => {
        const phoenix = nearestCell(cells, 33.45, -112.07).cell;
        const seattle = nearestCell(cells, 47.61, -122.33).cell;
        expect(sum(phoenix.etoMm)).toBeGreaterThan(sum(phoenix.rainfallMm) * 4);
        expect(sum(seattle.rainfallMm)).toBeGreaterThan(sum(seattle.etoMm));
        // Seattle's rain falls in winter; its summer is dry.
        expect(seattle.rainfallMm[11]).toBeGreaterThan(seattle.rainfallMm[6] * 3);
    });
    it('says nothing about places it does not cover', () => {
        expect(nearestCell(cells, 51.5, -0.12)).toBeNull(); // London
        expect(nearestCell(cells, 30, -40)).toBeNull(); // mid-Atlantic
    });
});
describe('finding weather for a point', () => {
    it('returns a record the rest of the app already accepts', async () => {
        const hit = (await findNormals(42.21, -83.5));
        expect(hit).not.toBeNull();
        expect(hit.gridOffsetKm).toBeLessThan(NORMALS_MAX_KM);
        // Placed where it was asked for, not at the cell centre.
        expect(hit.climate.latitude).toBe(42.21);
        expect(hit.climate.longitude).toBe(-83.5);
        expect(hit.climate.years).toEqual(NORMALS_YEARS);
        const parsed = parseObservedClimate({ mmssimClimate: 1, missing: [], ...hit.climate });
        expect('error' in parsed).toBe(false);
    });
});
describe('choosing weather for a newly located site', () => {
    const record = (over = {}) => ({
        id: 'c1', name: 'Ann Arbor, MI', ...ANN_ARBOR, ...over,
    });
    it('prefers a saved record for the same ground', async () => {
        const normals = await findNormals(42.21, -83.5);
        const choice = pickWeather(42.21, -83.5, [record()], normals);
        expect(choice.kind).toBe('saved');
        if (choice.kind === 'saved')
            expect(choice.km).toBeLessThan(SAVED_RADIUS_KM);
    });
    it('does not reuse a saved record from somewhere else', async () => {
        // The record fetched at 52°N must not answer for Ann Arbor.
        const elsewhere = record({ latitude: 52, longitude: -83.73 });
        const normals = await findNormals(42.21, -83.5);
        expect(pickWeather(42.21, -83.5, [elsewhere], normals).kind).toBe('normals');
    });
    it('falls back to nothing, rather than a guess, outside coverage', async () => {
        const normals = await findNormals(51.5, -0.12);
        expect(normals).toBeNull();
        expect(pickWeather(51.5, -0.12, [], normals).kind).toBe('none');
    });
});
