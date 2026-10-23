import { CATALOG } from './catalog';
import { effectiveSystem } from './simulate';
import type { Design, EvidenceTier } from './types';
import { parseEntry, parsePhoto, type LogEntry, type LogPhoto } from './yardLog';

/**
 * Sending the yard's results to its website.
 *
 * The simulator is where a result gets recorded, in the yard log, and it has
 * no server of its own. So it pushes to the yard's website (the Yard Systems
 * WordPress plugin), which keeps the copy of the log every device shares,
 * sets each of its systems' tier, and publishes any the yard has now tested.
 *
 * Everything is sent each time, not a diff, and the whole log comes back:
 * neither side keeps anything about what the other was last told, so a lost
 * or repeated push can never leave either half-updated.
 */

/** Every system's tier, as this design currently shows it. */
export function statusesFor(design: Design): Record<string, EvidenceTier> {
  const out: Record<string, EvidenceTier> = {};
  for (const def of [...CATALOG, ...design.customSystems]) {
    out[def.id] = effectiveSystem(def, design.overrides[def.id]).evidence;
  }
  return out;
}

/** The same statuses always give the same string, whatever order they were built in. */
export function statusSignature(statuses: Record<string, EvidenceTier>): string {
  return JSON.stringify(Object.keys(statuses).sort().map((id) => [id, statuses[id]]));
}

/**
 * Where to send, from what someone types as their website's address.
 *
 * The key travels with every push, so plain http is refused except on this
 * machine, where it can only be a local test site.
 */
export function endpointFor(address: string, route: 'sync' | 'photo' | 'statuses' = 'sync'): string | null {
  let a = address.trim();
  if (!a) return null;
  if (!/^https?:\/\//i.test(a)) a = `https://${a}`;
  let url: URL;
  try {
    url = new URL(a);
  } catch {
    return null;
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !local) return null;
  const base = url.origin + url.pathname.replace(/\/+$/, '');
  return `${base}/wp-json/yard-systems/v1/${route}`;
}

export interface SyncChange {
  title: string;
  change: string;
}

export interface SyncReply {
  site: string;
  changed: SyncChange[];
  /** How many of the entries sent were news to the website. */
  saved: number;
  /** The website's whole copy of the yard log. */
  entries: LogEntry[];
}

/** A failure worded for the person looking at it, not for a log. */
export class SyncError extends Error {
  /** True when trying again later could work: no network, or the site was down. */
  readonly retry: boolean;
  constructor(message: string, retry = false) {
    super(message);
    this.name = 'SyncError';
    this.retry = retry;
  }
}

/**
 * Send this device's statuses and its copy of the yard log, and get back the
 * website's copy, which by then holds both.
 */
export async function syncWithSite(
  address: string,
  key: string,
  statuses: Record<string, EvidenceTier>,
  entries: LogEntry[],
  fetchImpl: typeof fetch = fetch,
): Promise<SyncReply> {
  const body = await post(address, 'sync', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: key.trim(), statuses, entries }),
  }, fetchImpl);
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const changed = Array.isArray(b.changed)
    ? b.changed
      .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
      .map((c) => ({ title: String(c.title ?? ''), change: String(c.change ?? '') }))
    : [];
  return {
    site: typeof b.site === 'string' && b.site ? b.site : 'the website',
    changed,
    saved: typeof b.saved === 'number' ? b.saved : 0,
    entries: Array.isArray(b.entries)
      ? b.entries.map(parseEntry).filter((e): e is LogEntry => e !== null)
      : [],
  };
}

/** Send one entry's photo. The website keeps it private until the entry says otherwise. */
export async function uploadPhoto(
  address: string,
  key: string,
  entryId: string,
  photo: Blob,
  fetchImpl: typeof fetch = fetch,
): Promise<LogPhoto> {
  const form = new FormData();
  form.append('key', key.trim());
  form.append('entry', entryId);
  form.append('photo', photo, 'photo.jpg');
  const body = await post(address, 'photo', { body: form }, fetchImpl);
  const sent = parsePhoto(body);
  if (!sent) throw new SyncError('The website took the photo but didn’t say where it put it.', true);
  return sent;
}

async function post(
  address: string,
  route: 'sync' | 'photo',
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const endpoint = endpointFor(address, route);
  if (!endpoint) {
    throw new SyncError('That website address doesn’t look right. It should start with https://');
  }
  const host = new URL(endpoint).host;

  let res: Response;
  try {
    res = await fetchImpl(endpoint, { method: 'POST', ...init });
  } catch {
    throw new SyncError(`Couldn’t reach ${host}. It will try again when you’re back online.`, true);
  }

  if (res.status === 401 || res.status === 403) {
    throw new SyncError('The website refused the key. Copy it again from WordPress → Settings → Yard site.');
  }
  if (res.status === 404) {
    throw new SyncError(`No yard site at ${host}. Check the address, and that the Yard Systems plugin is active and up to date.`);
  }
  if (res.status === 413) {
    throw new SyncError('That photo is too big for the website.');
  }
  if (!res.ok) {
    throw new SyncError(`The website answered with an error (${res.status}).`, res.status >= 500);
  }

  try {
    return await res.json();
  } catch {
    throw new SyncError('The website’s answer wasn’t readable.');
  }
}
