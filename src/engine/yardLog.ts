import type { EvidenceTier, SystemOverride } from './types';

/**
 * The yard log: what was tried here, when, and how it went.
 *
 * It is the record behind every tested tier. A system's tier is the result
 * of its latest entry, so "works" always has a dated entry saying why, and
 * the same record shows on every device: the yard's website keeps the copy
 * that all of them read and add to.
 *
 * Devices can edit while offline and catch up later, so entries are merged
 * one by one, the newer copy of each winning. A deleted entry stays as a
 * marker, or a device that never saw the deletion would put it back.
 */

export type LogResult = Extract<EvidenceTier, 'testedSuccess' | 'testedPartial' | 'testedFailed'>;

export const LOG_RESULTS: LogResult[] = ['testedSuccess', 'testedPartial', 'testedFailed'];

export function isLogResult(v: unknown): v is LogResult {
  return LOG_RESULTS.includes(v as LogResult);
}

/** A photo once the website has it. */
export interface LogPhoto {
  id: number;
  url: string;
  thumb: string;
  w: number;
  h: number;
}

export interface LogEntry {
  id: string;
  /** The simulator system this is about. */
  system: string;
  /** `YYYY-MM-DD`, or `YYYY-MM` when only the month is known, or '' if neither. */
  date: string;
  /** What it showed. Null for a note that leaves the result as it was. */
  result: LogResult | null;
  note: string;
  /** Kept off the website. Its result still sets the system's tier. */
  private: boolean;
  photo: LogPhoto | null;
  /** When it was first written, in ms: orders entries made on the same day. */
  created: number;
  /** When it was last changed, in ms: the newer copy of an entry wins. */
  updated: number;
  deleted?: boolean;
}

/**
 * What the yard had recorded before there was a log, so the record starts
 * with the results it already had, dated as closely as they were reported.
 *
 * `updated` is 1 so that any edit or deletion, on any device, wins over these.
 */
export const SEED_LOG: LogEntry[] = [
  seed('aerobin', '2026-08', 'testedSuccess',
    'Loaded in mid-August with shredded leaves, cardboard cores, food-recycler output and diluted urine. It reached 130 °F within five days and held there about a week, then settled at 120 °F. A day after reloading it was back up to 125 °F.'),
  seed('biochar-kiln', '2026-08', 'testedSuccess',
    'Burned a batch in the kiln and crushed it.'),
  seed('biochar-tote', '2026-08', 'testedSuccess',
    'Charged the crushed char in a 27-gallon tote with diluted urine and water from the aquaponics tank, then worked it into the hot composter.'),
  seed('aquaponics', '2026-06', 'testedSuccess',
    'Stable, and running reliably since. It had a rough start: an ammonia spike in the first weeks, hard on the fingerlings, which big water changes and a dose of beneficial bacteria brought back.'),
  seed('nettle-patch', '2026-08', 'testedPartial',
    'The first ferment floated, grew mold and was dumped. The second, weighted under, worked.'),
  seed('banana-peel-tea', '2026-08', 'testedPartial',
    'The first batch floated, grew mold and was dumped. The second, with the peels weighted under, worked.'),
];

function seed(system: string, date: string, result: LogResult, note: string): LogEntry {
  return {
    id: `seed-${system}`, system, date, result, note,
    private: false, photo: null, created: 0, updated: 1,
  };
}

const DATE = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;

export function isLogDate(v: unknown): v is string {
  return v === '' || (typeof v === 'string' && DATE.test(v));
}

/** Oldest first: by date (undated first), then by when each was written. */
export function byDate(a: LogEntry, b: LogEntry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.created !== b.created) return a.created - b.created;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Two copies of the log as one: each entry from whichever copy changed it
 * last. On a tie the second copy's wins, so pass the website's copy second
 * and its tidied version of an entry (photo addresses filled in) is kept.
 */
export function mergeLogs(a: LogEntry[], b: LogEntry[]): LogEntry[] {
  const out = new Map<string, LogEntry>();
  for (const e of a) out.set(e.id, e);
  for (const e of b) {
    const have = out.get(e.id);
    if (!have || e.updated >= have.updated) out.set(e.id, e);
  }
  return [...out.values()];
}

/** Entries still in the log, oldest first. */
export function liveEntries(log: LogEntry[], system?: string): LogEntry[] {
  return log
    .filter((e) => !e.deleted && (system === undefined || e.system === system))
    .sort(byDate);
}

/**
 * The result the log gives each system it has ever mentioned: its latest
 * result, or null when none of its entries (any more) records one.
 */
export function resultsFromLog(log: LogEntry[]): Record<string, LogResult | null> {
  const out: Record<string, LogResult | null> = {};
  for (const e of log) if (!(e.system in out)) out[e.system] = null;
  for (const e of liveEntries(log)) if (e.result) out[e.system] = e.result;
  return out;
}

const TESTED = new Set<EvidenceTier>(LOG_RESULTS);

/**
 * The design's overrides with every tested tier taken from the log.
 *
 * A system the log has spoken about gets the log's latest result as its
 * tier, or loses a tested tier it no longer has an entry for. Systems the log
 * has never mentioned are left as they are. Hands back the same object when
 * nothing changes, so applying it on every change cannot loop.
 */
export function applyLog(
  overrides: Record<string, SystemOverride>,
  log: LogEntry[],
): Record<string, SystemOverride> {
  let out = overrides;
  const edit = () => (out === overrides ? (out = { ...overrides }) : out);

  for (const [id, result] of Object.entries(resultsFromLog(log))) {
    const current = overrides[id]?.evidence;
    if (result) {
      if (current !== result) edit()[id] = { ...overrides[id], evidence: result };
    } else if (current && TESTED.has(current)) {
      const { evidence: _drop, ...rest } = overrides[id];
      if (Object.keys(rest).length) edit()[id] = rest;
      else delete edit()[id];
    }
  }
  return out;
}

/**
 * Results a design held before there was a log, as entries, so a device that
 * was used for a while without one adds what it knew instead of losing it.
 *
 * Only results the log disagrees with are carried over. They are dated the
 * day they were carried over (the real date was never kept) and kept
 * private, as they have no note to show. The id is the same on every device,
 * so two devices that both had a system marked the same way add one entry.
 */
export function entriesFromOverrides(
  overrides: Record<string, SystemOverride>,
  log: LogEntry[],
  now: number,
  today: string,
): LogEntry[] {
  const results = resultsFromLog(log);
  const out: LogEntry[] = [];
  for (const [system, ov] of Object.entries(overrides)) {
    const tier = ov?.evidence;
    if (!isLogResult(tier) || results[system] === tier) continue;
    out.push({
      id: `pre-log-${system}-${tier}`, system, date: today, result: tier,
      note: '', private: true, photo: null, created: now, updated: now,
    });
  }
  return out;
}

/** Today in the device's own time zone, as `YYYY-MM-DD`. */
export function localDate(at: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

/** "August 14, 2026", "August 2026", or "Undated". */
export function formatLogDate(date: string): string {
  if (!isLogDate(date) || !date) return 'Undated';
  const [y, m, d] = date.split('-').map(Number);
  return d ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${y}`;
}

/** Anything that must reach the website: changes it has not acknowledged. */
export function logSignature(log: LogEntry[]): string {
  return log.map((e) => `${e.id}:${e.updated}`).sort().join('|');
}

/**
 * An entry as the website sent it, or null if it is not one. The website
 * checks what it stores, but a device keeps what it is given, so this
 * checks again rather than trusting the shape.
 */
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function parseEntry(raw: unknown): LogEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id || typeof r.system !== 'string' || !r.system) return null;
  return {
    id: r.id,
    system: r.system,
    date: isLogDate(r.date) ? r.date : '',
    result: isLogResult(r.result) ? r.result : null,
    note: typeof r.note === 'string' ? r.note : '',
    private: r.private === true,
    photo: parsePhoto(r.photo),
    created: num(r.created),
    updated: num(r.updated),
    ...(r.deleted === true ? { deleted: true } : {}),
  };
}

/** A photo as the website describes it, or null. */
export function parsePhoto(raw: unknown): LogPhoto | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.url !== 'string' || !p.url) return null;
  return {
    id: num(p.id), url: p.url, thumb: typeof p.thumb === 'string' && p.thumb ? p.thumb : p.url,
    w: num(p.w), h: num(p.h),
  };
}
