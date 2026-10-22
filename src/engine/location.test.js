import { describe, expect, it } from 'vitest';
import { ZIP_CENTROIDS } from './data/zip-centroids';
import { isPlausibleZip, lookupZip, plausibleClimates } from './location';
describe('ZIP lookup', () => {
    // Spot checks against places whose latitude is not in dispute. The table is
    // collapsed to prefixes, so a degree of slack is expected and declared.
    const KNOWN = [
        ['97218', 'Portland OR', 45.6],
        ['10001', 'Manhattan NY', 40.75],
        ['33101', 'Miami FL', 25.8],
        ['99501', 'Anchorage AK', 61.2],
        ['96813', 'Honolulu HI', 21.3],
        ['59718', 'Bozeman MT', 45.7],
        ['85001', 'Phoenix AZ', 33.4],
        ['04401', 'Bangor ME', 44.8],
    ];
    it.each(KNOWN)('puts %s (%s) within a degree and a half', (zip, _place, lat) => {
        const hit = lookupZip(zip);
        expect(hit).not.toBeNull();
        expect(Math.abs(hit.latitude - lat)).toBeLessThan(1.5);
        expect(hit.longitude).toBeLessThan(0); // the whole US is west of Greenwich
    });
    it('reports how sure it is', () => {
        const hit = lookupZip('97218');
        expect(hit.accuracyDeg).toBeGreaterThanOrEqual(0);
        expect(hit.accuracyDeg).toBeLessThanOrEqual(1.5);
        expect(hit.source).toBe('zip');
        expect(hit.label).toBe('ZIP 97218');
    });
    it('falls back to a shorter prefix for a ZIP it has never seen', () => {
        // 97219 exists; 97299 almost certainly does not, but 972 does.
        const hit = lookupZip('97299');
        expect(hit).not.toBeNull();
        expect(Math.abs(hit.latitude - 45.5)).toBeLessThan(2);
    });
    it('copes with the ways people actually type a ZIP', () => {
        const target = lookupZip('97218').latitude;
        for (const raw of ['97218', ' 97218 ', '97218-1234', '97218 ']) {
            expect(lookupZip(raw)?.latitude).toBe(target);
        }
    });
    it('refuses what is not a ZIP', () => {
        for (const bad of ['', '1', 'ab', 'portland']) {
            expect(lookupZip(bad)).toBeNull();
            expect(isPlausibleZip(bad)).toBe(false);
        }
        expect(isPlausibleZip('97218')).toBe(true);
    });
    it('has a table that is sane end to end', () => {
        const rows = Object.entries(ZIP_CENTROIDS);
        expect(rows.length).toBeGreaterThan(1000);
        for (const [key, [lat, lon, dev]] of rows) {
            expect(key).toMatch(/^\d{3,5}$/);
            // US states and territories, from American Samoa to northern Alaska.
            expect(lat).toBeGreaterThan(-15);
            expect(lat).toBeLessThan(72);
            expect(Math.abs(lon)).toBeLessThanOrEqual(180);
            expect(dev).toBeLessThanOrEqual(1.5);
        }
    });
});
describe('plausible climates', () => {
    it('does not offer a tropical preset to Alaska', () => {
        expect(plausibleClimates(61)).not.toContain('tropicalWetDry');
    });
    it('does not offer a cold continental preset to Hawaii', () => {
        expect(plausibleClimates(21)).not.toContain('coldContinental');
    });
    it('always offers something', () => {
        for (let lat = -66; lat <= 66; lat += 3) {
            expect(plausibleClimates(lat).length).toBeGreaterThan(0);
        }
    });
});
