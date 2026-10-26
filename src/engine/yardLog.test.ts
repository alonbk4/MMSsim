import { describe, expect, it } from 'vitest';
import { createDefaultDesign } from './defaults';
import {
  applyLog, entriesFromOverrides, formatLogDate, logBySeason, logSignature, mergeLogs, parseEntry,
  resultsFromLog, SEED_LOG, type LogEntry,
} from './yardLog';

const entry = (over: Partial<LogEntry> & Pick<LogEntry, 'id' | 'system'>): LogEntry => ({
  date: '2026-09-01', result: null, note: '', private: false, photo: null,
  created: 100, updated: 100, ...over,
});

describe('the yard log', () => {
  it('starts out agreeing with the yard results the starting design carries', () => {
    const design = createDefaultDesign();
    expect(applyLog(design.overrides, SEED_LOG)).toBe(design.overrides);
  });

  it('takes each system’s tier from its latest result, not its latest entry', () => {
    const log = [
      entry({ id: 'a', system: 'rain-garden', date: '2026-05', result: 'testedFailed' }),
      entry({ id: 'b', system: 'rain-garden', date: '2026-07-02', result: 'testedSuccess' }),
      // A note after it leaves the result alone.
      entry({ id: 'c', system: 'rain-garden', date: '2026-08-10', result: null }),
    ];
    expect(resultsFromLog(log)['rain-garden']).toBe('testedSuccess');
  });

  it('orders entries on the same day by when they were written', () => {
    const log = [
      entry({ id: 'later', system: 'x', created: 200, result: 'testedPartial' }),
      entry({ id: 'first', system: 'x', created: 100, result: 'testedSuccess' }),
    ];
    expect(resultsFromLog(log).x).toBe('testedPartial');
  });

  it('drops a tested tier when its results are deleted, and leaves other systems alone', () => {
    const overrides = {
      'rain-garden': { evidence: 'testedSuccess' as const, yieldFactor: 0.8 },
      'chapin-bucket': { evidence: 'testedFailed' as const },
      'first-flush': { evidence: 'researched' as const },
    };
    const log = [
      entry({ id: 'a', system: 'rain-garden', result: 'testedSuccess', deleted: true }),
      entry({ id: 'b', system: 'first-flush', result: 'testedFailed', deleted: true }),
    ];
    const out = applyLog(overrides, log);
    expect(out['rain-garden']).toEqual({ yieldFactor: 0.8 });
    // Never mentioned by the log: kept as the design had it.
    expect(out['chapin-bucket']).toEqual({ evidence: 'testedFailed' });
    // An untested tier was never the log's to remove.
    expect(out['first-flush']).toEqual({ evidence: 'researched' });
  });

  it('keeps the newer copy of each entry, and the website’s on a tie', () => {
    const mine = [entry({ id: 'a', system: 'x', note: 'mine', updated: 300 }), entry({ id: 'b', system: 'x', note: 'mine', updated: 100 })];
    const site = [entry({ id: 'a', system: 'x', note: 'site', updated: 200 }), entry({ id: 'b', system: 'x', note: 'site', updated: 100 }), entry({ id: 'c', system: 'x' })];
    const merged = Object.fromEntries(mergeLogs(mine, site).map((e) => [e.id, e.note]));
    expect(merged).toEqual({ a: 'mine', b: 'site', c: '' });
  });

  it('lets a deletion anywhere win over the seeded record', () => {
    const gone = { ...SEED_LOG[0], deleted: true, updated: 5 };
    expect(mergeLogs(SEED_LOG, [gone]).find((e) => e.id === gone.id)?.deleted).toBe(true);
    expect(mergeLogs([gone], SEED_LOG).find((e) => e.id === gone.id)?.deleted).toBe(true);
  });

  it('carries over results set before the log, once, the same way on every device', () => {
    const overrides = {
      aerobin: { evidence: 'testedSuccess' as const }, // already in the log
      'rain-garden': { evidence: 'testedFailed' as const },
      'first-flush': { evidence: 'researched' as const },
    };
    const a = entriesFromOverrides(overrides, SEED_LOG, 1000, '2026-10-23');
    const b = entriesFromOverrides(overrides, SEED_LOG, 2000, '2026-10-24');
    expect(a.map((e) => e.system)).toEqual(['rain-garden']);
    expect(a[0]).toMatchObject({ result: 'testedFailed', private: true, date: '2026-10-23' });
    expect(a[0].id).toBe(b[0].id);
    // Once carried over, there is nothing left to carry.
    expect(entriesFromOverrides(overrides, [...SEED_LOG, ...a], 3000, '2026-10-25')).toEqual([]);
  });

  it('says dates the way they were recorded', () => {
    expect(formatLogDate('2026-08-14')).toBe('August 14, 2026');
    expect(formatLogDate('2026-08')).toBe('August 2026');
    expect(formatLogDate('')).toBe('Undated');
  });

  it('reads season by season, newest first, with a winter spanning the new year', () => {
    const log = [
      entry({ id: 'a', system: 'x', date: '2026-08' }),
      entry({ id: 'b', system: 'y', date: '2026-06-03' }),
      entry({ id: 'c', system: 'x', date: '2026-10-21' }),
      entry({ id: 'd', system: 'z', date: '2026-12-02' }),
      entry({ id: 'e', system: 'z', date: '2027-02-20' }),
      entry({ id: 'f', system: 'y', date: '' }),
      entry({ id: 'g', system: 'y', date: '2026-07-01', deleted: true }),
    ];
    const seasons = logBySeason(log);
    expect(seasons.map((s) => s.label)).toEqual(['Winter 2026–27', 'Fall 2026', 'Summer 2026', 'Undated']);
    expect(seasons.map((s) => s.entries.map((e) => e.id))).toEqual([['e', 'd'], ['c'], ['a', 'b'], ['f']]);
    expect(seasons.map((s) => s.season)).toEqual(['winter', 'fall', 'summer', null]);
  });

  it('names the seasons the other way round south of the equator', () => {
    const log = [
      entry({ id: 'a', system: 'x', date: '2026-07-10' }),
      entry({ id: 'b', system: 'x', date: '2026-12-25' }),
    ];
    expect(logBySeason(log, true).map((s) => s.label)).toEqual(['Summer 2026–27', 'Winter 2026']);
  });

  it('changes its signature when any entry changes', () => {
    const log = [entry({ id: 'a', system: 'x' })];
    expect(logSignature(log)).not.toBe(logSignature([{ ...log[0], updated: 101 }]));
  });

  it('reads entries from the website defensively', () => {
    expect(parseEntry({ id: 'a' })).toBeNull();
    const e = parseEntry({
      id: 'a', system: 'x', date: 'soon', result: 'proven', note: 5, private: 'yes',
      photo: { id: 3, url: 'https://s/p.jpg' }, created: 1, updated: 2,
    });
    expect(e).toMatchObject({ date: '', result: null, note: '', private: false });
    expect(e?.photo).toEqual({ id: 3, url: 'https://s/p.jpg', thumb: 'https://s/p.jpg', w: 0, h: 0 });
  });
});
