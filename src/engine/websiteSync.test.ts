import { describe, expect, it, vi } from 'vitest';
import { CATALOG } from './catalog';
import { createDefaultDesign } from './defaults';
import { endpointFor, statusesFor, statusSignature, syncWithSite, SyncError, uploadPhoto } from './websiteSync';
import { ANN_ARBOR_LOG, applyLog } from './yardLog';

describe('statuses sent to the website', () => {
  it('reports what the design shows, overrides included', () => {
    const design = createDefaultDesign();
    // On the yard's own device its log sets the tested tiers.
    design.overrides = applyLog(design.overrides, ANN_ARBOR_LOG);
    const statuses = statusesFor(design);
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
    const want = 'https://example.com/wp-json/yard-systems/v1/sync';
    expect(endpointFor('https://example.com')).toBe(want);
    expect(endpointFor('https://example.com/')).toBe(want);
    expect(endpointFor('example.com')).toBe(want);
    expect(endpointFor('  https://example.com//  ')).toBe(want);
    expect(endpointFor('https://example.com/blog')).toBe('https://example.com/blog/wp-json/yard-systems/v1/sync');
    expect(endpointFor('example.com', 'photo')).toBe('https://example.com/wp-json/yard-systems/v1/photo');
  });

  it('refuses to send the key in the clear, except to this machine', () => {
    expect(endpointFor('http://example.com')).toBeNull();
    expect(endpointFor('http://localhost:8088')).toBe('http://localhost:8088/wp-json/yard-systems/v1/sync');
    expect(endpointFor('')).toBeNull();
    expect(endpointFor('not a url at all')).toBeNull();
  });
});

describe('sending', () => {
  const reply = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it('posts the key, every status and the log, and reads back the website’s copy', async () => {
    const fetchImpl = reply(200, {
      site: 'makeMIsustainable',
      changed: [{ title: 'Worm tea', change: 'Researched → Works here, published' }],
      saved: 6,
      entries: [...ANN_ARBOR_LOG, { id: 'junk' }],
    });
    const out = await syncWithSite('example.com', ' k3y ', { aerobin: 'testedSuccess' }, ANN_ARBOR_LOG, fetchImpl);
    expect(out.site).toBe('makeMIsustainable');
    expect(out.changed).toEqual([{ title: 'Worm tea', change: 'Researched → Works here, published' }]);
    expect(out.saved).toBe(6);
    // What is not an entry is dropped, not kept.
    expect(out.entries).toEqual(ANN_ARBOR_LOG);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://example.com/wp-json/yard-systems/v1/sync');
    expect(JSON.parse(init.body)).toEqual({ key: 'k3y', statuses: { aerobin: 'testedSuccess' }, entries: ANN_ARBOR_LOG });
  });

  it('sends a photo as a form, and reads back where it went', async () => {
    const fetchImpl = reply(200, { id: 7, url: 'https://example.com/p-1024.jpg', thumb: 'https://example.com/p-300.jpg', w: 1024, h: 768 });
    const photo = await uploadPhoto('example.com', 'k', 'e1', new Blob(['x'], { type: 'image/jpeg' }), fetchImpl);
    expect(photo).toEqual({ id: 7, url: 'https://example.com/p-1024.jpg', thumb: 'https://example.com/p-300.jpg', w: 1024, h: 768 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://example.com/wp-json/yard-systems/v1/photo');
    expect((init.body as FormData).get('entry')).toBe('e1');
    expect((init.body as FormData).get('key')).toBe('k');
  });

  it('says plainly when the key is wrong, and does not offer to retry', async () => {
    const err = await syncWithSite('example.com', 'nope', {}, [], reply(401, {})).catch((e) => e);
    expect(err).toBeInstanceOf(SyncError);
    expect(err.message).toMatch(/refused the key/);
    expect(err.retry).toBe(false);
  });

  it('says so when there is no yard site at the address', async () => {
    const err = await syncWithSite('example.com', 'k', {}, [], reply(404, {})).catch((e) => e);
    expect(err.message).toMatch(/No yard site at example\.com/);
  });

  it('marks a dropped connection as worth retrying', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await syncWithSite('example.com', 'k', {}, [], fetchImpl).catch((e) => e);
    expect(err.message).toMatch(/Couldn’t reach example\.com/);
    expect(err.retry).toBe(true);
  });

  it('refuses a bad address before touching the network', async () => {
    const fetchImpl = vi.fn();
    const err = await syncWithSite('http://example.com', 'k', {}, [], fetchImpl).catch((e) => e);
    expect(err.message).toMatch(/https/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('tolerates a reply missing its parts', async () => {
    expect(await syncWithSite('example.com', 'k', {}, [], reply(200, {})))
      .toEqual({ site: 'the website', changed: [], saved: 0, entries: [] });
  });
});
