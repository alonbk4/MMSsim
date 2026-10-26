// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDesign } from '../engine/defaults';
import { ANN_ARBOR_LOG } from '../engine/yardLog';
import { useApp } from './store';
import { startYardLog, useYardLog } from './yardLog';

const tier = (id: string) => useApp.getState().design.overrides[id]?.evidence;

describe('a new person’s device', () => {
  beforeEach(() => {
    useApp.setState({ design: createDefaultDesign() });
    useYardLog.setState({ entries: [], pending: [], carried: false });
  });

  it('starts with an empty log and none of the Ann Arbor yard’s results', () => {
    const stop = startYardLog();
    expect(useYardLog.getState().entries).toEqual([]);
    for (const e of ANN_ARBOR_LOG) expect(tier(e.system)).toBeUndefined();
    stop();
  });

  it('drops the Ann Arbor tiers an older starting design gave it, without logging them as its own', () => {
    const design = createDefaultDesign();
    design.overrides.aerobin = { evidence: 'testedSuccess', yieldFactor: 1.2 };
    design.overrides['nettle-patch'] = { evidence: 'testedPartial' };
    design.overrides['rain-garden'] = { evidence: 'testedPartial' }; // set by the person
    useApp.setState({ design });

    const stop = startYardLog();
    expect(tier('aerobin')).toBeUndefined();
    expect(useApp.getState().design.overrides.aerobin.yieldFactor).toBe(1.2);
    expect(tier('nettle-patch')).toBeUndefined();
    expect(tier('rain-garden')).toBe('testedPartial');
    expect(useYardLog.getState().entries.map((e) => e.system)).toEqual(['rain-garden']);
    stop();
  });

  it('is not given the record when the stored log is read back', async () => {
    localStorage.setItem('mmssim.yardlog.v1', JSON.stringify({
      state: { entries: [], pending: [], carried: true }, version: 0,
    }));
    await useYardLog.persist.rehydrate();
    expect(useYardLog.getState().entries).toEqual([]);
  });
});

describe('a device of the Ann Arbor yard’s', () => {
  beforeEach(() => {
    useApp.setState({ design: createDefaultDesign() });
    useYardLog.setState({ entries: ANN_ARBOR_LOG, pending: [], carried: false });
  });

  it('keeps the record it already holds when the stored log is read back', async () => {
    localStorage.setItem('mmssim.yardlog.v1', JSON.stringify({
      state: { entries: ANN_ARBOR_LOG, pending: [], carried: true }, version: 0,
    }));
    await useYardLog.persist.rehydrate();
    expect(useYardLog.getState().entries.map((e) => e.id).sort())
      .toEqual(ANN_ARBOR_LOG.map((e) => e.id).sort());
  });

  it('carries in results set before the log, and they outrank the Ann Arbor record', () => {
    const design = createDefaultDesign();
    design.overrides.aerobin = { evidence: 'testedFailed' };
    design.overrides['rain-garden'] = { evidence: 'testedPartial' };
    useApp.setState({ design });

    const stop = startYardLog();
    expect(tier('aerobin')).toBe('testedFailed');
    expect(tier('rain-garden')).toBe('testedPartial');
    const carried = useYardLog.getState().entries.filter((e) => e.id.startsWith('pre-log-'));
    expect(carried.map((e) => e.system).sort()).toEqual(['aerobin', 'rain-garden']);
    expect(carried.every((e) => e.private)).toBe(true);
    expect(useYardLog.getState().carried).toBe(true);
    stop();
  });

  it('moves the tier with each entry, and back when the entry goes', async () => {
    const stop = startYardLog();
    expect(tier('chapin-bucket')).toBeUndefined();

    const id = await useYardLog.getState().save({
      system: 'chapin-bucket', date: '2026-10-20', result: 'testedSuccess', note: 'Drips evenly.', private: false,
    });
    expect(tier('chapin-bucket')).toBe('testedSuccess');

    useYardLog.getState().remove(id);
    expect(tier('chapin-bucket')).toBeUndefined();
    stop();
  });

  it('gives a loaded design the log’s tiers back', () => {
    const stop = startYardLog();
    const loaded = createDefaultDesign();
    loaded.overrides.aerobin = { evidence: 'researched' };
    useApp.getState().loadDesign(loaded);
    expect(tier('aerobin')).toBe('testedSuccess');
    stop();
  });

  it('carries in a tested tier from a design loaded later, but only where the log has no say', () => {
    const stop = startYardLog();
    const loaded = createDefaultDesign();
    loaded.overrides['grow-trellis'] = { evidence: 'testedSuccess' }; // never in the log
    loaded.overrides.aerobin = { evidence: 'testedFailed' }; // the log says works
    useApp.getState().loadDesign(loaded);

    const carried = useYardLog.getState().entries.filter((e) => e.id.startsWith('pre-log-'));
    expect(carried.map((e) => [e.system, e.result, e.private])).toEqual([['grow-trellis', 'testedSuccess', true]]);
    expect(tier('grow-trellis')).toBe('testedSuccess');
    expect(tier('aerobin')).toBe('testedSuccess');

    // Loading it again adds nothing.
    useApp.getState().loadDesign(loaded);
    expect(useYardLog.getState().entries.filter((e) => e.id.startsWith('pre-log-'))).toHaveLength(1);
    stop();
  });

  it('takes in another device’s entries', () => {
    const stop = startYardLog();
    useYardLog.getState().mergeFromSite([{
      id: 'phone-1', system: 'rain-garden', date: '2026-10-01', result: 'testedFailed', note: '',
      private: false, photo: null, created: 5, updated: 5,
    }]);
    expect(tier('rain-garden')).toBe('testedFailed');
    stop();
  });
});
