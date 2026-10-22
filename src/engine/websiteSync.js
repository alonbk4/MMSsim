import { CATALOG } from './catalog';
import { effectiveSystem } from './simulate';
/**
 * Sending the yard's results to its website.
 *
 * The simulator is where a result gets recorded — this worked, that partly
 * worked, the other failed — and it keeps that in the browser with no server
 * behind it. So nothing can read it from outside; the simulator has to push.
 * The website (the Yard Systems WordPress plugin) takes every system's tier,
 * updates the systems that follow one of these ids, and publishes any the
 * yard has now tested.
 *
 * Everything is sent each time, not a diff: the site keeps nothing about
 * what it was last told, so a lost or repeated push can never leave it
 * half-updated.
 */
/** Every system's tier, as this design currently shows it. */
export function statusesFor(design) {
    const out = {};
    for (const def of [...CATALOG, ...design.customSystems]) {
        out[def.id] = effectiveSystem(def, design.overrides[def.id]).evidence;
    }
    return out;
}
/** The same statuses always give the same string, whatever order they were built in. */
export function statusSignature(statuses) {
    return JSON.stringify(Object.keys(statuses).sort().map((id) => [id, statuses[id]]));
}
/**
 * Where to send, from what someone types as their website's address.
 *
 * The key travels with every push, so plain http is refused except on this
 * machine, where it can only be a local test site.
 */
export function endpointFor(address) {
    let a = address.trim();
    if (!a)
        return null;
    if (!/^https?:\/\//i.test(a))
        a = `https://${a}`;
    let url;
    try {
        url = new URL(a);
    }
    catch {
        return null;
    }
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !local)
        return null;
    const base = url.origin + url.pathname.replace(/\/+$/, '');
    return `${base}/wp-json/yard-systems/v1/statuses`;
}
/** A failure worded for the person looking at it, not for a log. */
export class SyncError extends Error {
    /** True when trying again later could work: no network, or the site was down. */
    retry;
    constructor(message, retry = false) {
        super(message);
        this.name = 'SyncError';
        this.retry = retry;
    }
}
export async function sendStatuses(address, key, statuses, fetchImpl = fetch) {
    const endpoint = endpointFor(address);
    if (!endpoint) {
        throw new SyncError('That website address doesn’t look right. It should start with https://');
    }
    const host = new URL(endpoint).host;
    let res;
    try {
        res = await fetchImpl(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key.trim(), statuses }),
        });
    }
    catch {
        throw new SyncError(`Couldn’t reach ${host}. It will try again when you’re back online.`, true);
    }
    if (res.status === 401 || res.status === 403) {
        throw new SyncError('The website refused the key. Copy it again from WordPress → Settings → Yard site.');
    }
    if (res.status === 404) {
        throw new SyncError(`No yard site at ${host}. Check the address, and that the Yard Systems plugin is active.`);
    }
    if (!res.ok) {
        throw new SyncError(`The website answered with an error (${res.status}).`, res.status >= 500);
    }
    let body;
    try {
        body = await res.json();
    }
    catch {
        throw new SyncError('The website’s answer wasn’t readable.');
    }
    return parseReply(body);
}
function parseReply(body) {
    const b = (body && typeof body === 'object' ? body : {});
    const changed = Array.isArray(b.changed)
        ? b.changed
            .filter((c) => !!c && typeof c === 'object')
            .map((c) => ({ title: String(c.title ?? ''), change: String(c.change ?? '') }))
        : [];
    return { site: typeof b.site === 'string' && b.site ? b.site : 'the website', changed };
}
