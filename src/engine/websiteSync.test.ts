import { describe, expect, it, vi } from 'vitest';
import { CATALOG } from './catalog';
import { createDefaultDesign } from './defaults';
import { endpointFor, sendStatuses, statusesFor, statusSignature, SyncError } from './websiteSync';

describe('statuses sent to the website', () => {
  it('reports what the design shows, overrides included', () => {
    const design = createDefaultDesign();
    const statuses = statusesFor(design);
    // The yard's own results ride on the starter design.
    expect(statuses.aerobin).toBe('testedSuccess');
    expect(statuses['nettle-patch']).toBe('testedPartial');
    // Untouched systems go as the catalog has them.
    expect(statuses['rain-garden']).toBe('researched');

    design.overrides['rain-garden'] = { evidence: 'testedFailed' };
    expect(statusesFor(design)['rain-garden']).toBe('testedFailed');
  });

  it('includes systems the user wrote themselves', () => {
    const design = createDefaultDesign();
    const base = statusesFor(design).aerobin;
    design.customSystems.push({ ...CATALOG[0], id: 'my-thing', evidence: 'experimental' });
    expect(statusesFor(design)['my-thing']).toBe('experimental');
    expect(statusesFor(design).aerobin).toBe(base);
  });

  it('signs the same statuses the same way whatever their order', () => {
    expect(statusSignature({ a: 'researched', b: 'testedSuccess' }))
      .toBe(statusSignature({ b: 'testedSuccess', a: 'researched' }));
    expect(statusSignature({ a: 'researched' })).not.toBe(statusSignature({ a: 'testedSuccess' }));
  });
});

describe('the website address', () => {
  it('finds the endpoint from what people actually type', () => {
    const want = 'https://example.com/wp-json/yard-systems/v1/statuses';
    expect(endpointFor('https://example.com')).toBe(want);
    expect(endpointFor('https://example.com/')).toBe(want);
    expect(endpointFor('example.com')).toBe(want);
    expect(endpointFor('  https://example.com//  ')).toBe(want);
    expect(endpointFor('https://example.com/blog')).toBe('https://example.com/blog/wp-json/yard-systems/v1/statuses');
  });

  it('refuses to send the key in the clear, except to this machine', () => {
    expect(endpointFor('http://example.com')).toBeNull();
    expect(endpointFor('http://localhost:8088')).toBe('http://localhost:8088/wp-json/yard-systems/v1/statuses');
    expect(endpointFor('')).toBeNull();
    expect(endpointFor('not a url at all')).toBeNull();
  });
});

describe('sending', () => {
  const reply = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it('posts the key and every status, and reads back what changed', async () => {
    const fetchImpl = reply(200, { site: 'makeMIsustainable', changed: [{ title: 'Worm tea', change: 'Researched → Works here, published' }] });
    const out = await sendStatuses('example.com', ' k3y ', { aerobin: 'testedSuccess' }, fetchImpl);
    expect(out).toEqual({ site: 'makeMIsustainable', changed: [{ title: 'Worm tea', change: 'Researched → Works here, published' }] });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://example.com/wp-json/yard-systems/v1/statuses');
    expect(JSON.parse(init.body)).toEqual({ key: 'k3y', statuses: { aerobin: 'testedSuccess' } });
  });

  it('says plainly when the key is wrong, and does not offer to retry', async () => {
    const err = await sendStatuses('example.com', 'nope', {}, reply(401, {})).catch((e) => e);
    expect(err).toBeInstanceOf(SyncError);
    expect(err.message).toMatch(/refused the key/);
    expect(err.retry).toBe(false);
  });

  it('says so when there is no yard site at the address', async () => {
    const err = await sendStatuses('example.com', 'k', {}, reply(404, {})).catch((e) => e);
    expect(err.message).toMatch(/No yard site at example\.com/);
  });

  it('marks a dropped connection as worth retrying', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await sendStatuses('example.com', 'k', {}, fetchImpl).catch((e) => e);
    expect(err.message).toMatch(/Couldn’t reach example\.com/);
    expect(err.retry).toBe(true);
  });

  it('refuses a bad address before touching the network', async () => {
    const fetchImpl = vi.fn();
    const err = await sendStatuses('http://example.com', 'k', {}, fetchImpl).catch((e) => e);
    expect(err.message).toMatch(/https/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('tolerates a reply missing its parts', async () => {
    expect(await sendStatuses('example.com', 'k', {}, reply(200, {}))).toEqual({ site: 'the website', changed: [] });
  });
});
