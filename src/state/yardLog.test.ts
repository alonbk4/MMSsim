// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDesign } from '../engine/defaults';
import { SEED_LOG } from '../engine/yardLog';
import { useApp } from './store';
import { startYardLog, useYardLog } from './yardLog';

const tier = (id: string) => useApp.getState().design.overrides[id]?.evidence;

describe('the yard log on a device', () => {
  beforeEach(() => {
    useApp.setState({ design: createDefaultDesign() });
    useYardLog.setState({ entries: SEED_LOG, pending: [], carried: false });
  });

  it('carries in results set before the log, and they outrank the seeded record', () => {
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
