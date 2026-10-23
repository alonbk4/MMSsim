import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '../engine/defaults';
import {
  applyLog, entriesFromOverrides, localDate, mergeLogs, parseEntry, SEED_LOG,
  type LogEntry, type LogPhoto, type LogResult,
} from '../engine/yardLog';
import { forgetPhoto, keepPhoto } from './photos';
import { useApp } from './store';

/**
 * This device's copy of the yard log.
 *
 * It works with no website at all. With one connected (Site tab → Website),
 * the website's copy is merged in on every sync, so each device ends up with
 * every entry made on any of them.
 */

/** What the record form edits. */
export interface LogDraft {
  id?: string;
  system: string;
  date: string;
  result: LogResult | null;
  note: string;
  private: boolean;
}

interface YardLogState {
  entries: LogEntry[];
  /** Entries with a photo on this device that the website does not have yet. */
  pending: string[];
  /** Whether the results this device held before the log have been carried into it. */
  carried: boolean;

  /**
   * Add or change an entry. `photo` is a new photo to send, null to remove the
   * one it has, or left out to keep it.
   */
  save: (draft: LogDraft, photo?: Blob | null) => Promise<string>;
  remove: (id: string) => void;
  /** Take in the website's copy. */
  mergeFromSite: (entries: LogEntry[]) => void;
  /** The website has an entry's photo now. */
  photoSent: (id: string, photo: LogPhoto) => void;
  /** Stop waiting to send a photo that can no longer be sent. */
  dropPending: (id: string) => void;
}

const entryId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : newId('log'));

export const useYardLog = create<YardLogState>()(
  persist(
    (set, get) => ({
      entries: SEED_LOG,
      pending: [],
      carried: false,

      save: async (draft, photo) => {
        const now = Date.now();
        const have = draft.id ? get().entries.find((e) => e.id === draft.id) : undefined;
        const id = have?.id ?? entryId();
        // Kept before anything else changes: if this device cannot hold the
        // photo, nothing is half-saved.
        if (photo) await keepPhoto(id, photo);
        if (photo === null) void forgetPhoto(id);

        const entry: LogEntry = {
          id,
          system: draft.system,
          date: draft.date,
          result: draft.result,
          note: draft.note,
          private: draft.private,
          photo: photo === undefined ? have?.photo ?? null : null,
          created: have?.created ?? now,
          updated: now,
        };
        set((s) => ({
          entries: have ? s.entries.map((e) => (e.id === id ? entry : e)) : [...s.entries, entry],
          pending: photo
            ? [...s.pending.filter((p) => p !== id), id]
            : photo === null ? s.pending.filter((p) => p !== id) : s.pending,
        }));
        return id;
      },

      remove: (id) => {
        void forgetPhoto(id);
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id
            ? { ...e, note: '', photo: null, deleted: true, updated: Date.now() }
            : e)),
          pending: s.pending.filter((p) => p !== id),
        }));
      },

      mergeFromSite: (incoming) =>
        set((s) => {
          const entries = mergeLogs(s.entries, incoming);
          const gone = new Set(entries.filter((e) => e.deleted).map((e) => e.id));
          for (const id of s.pending) if (gone.has(id)) void forgetPhoto(id);
          return { entries, pending: s.pending.filter((p) => !gone.has(p)) };
        }),

      photoSent: (id, photo) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, photo, updated: Date.now() } : e)),
          pending: s.pending.filter((p) => p !== id),
        })),

      dropPending: (id) => set((s) => ({ pending: s.pending.filter((p) => p !== id) })),
    }),
    {
      name: 'mmssim.yardlog.v1',
      partialize: ({ entries, pending, carried }) => ({ entries, pending, carried }),
      /**
       * The seeded record is merged in on every load, so a device that opened
       * the app before an entry was added to it still gets it, and an entry
       * deleted here stays deleted. Stored entries are checked one by one: a
       * bad one is dropped, not allowed to break the rest.
       */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<YardLogState>;
        const stored = Array.isArray(p.entries)
          ? p.entries.map(parseEntry).filter((e): e is LogEntry => e !== null)
          : [];
        return {
          ...current,
          entries: mergeLogs(SEED_LOG, stored),
          pending: Array.isArray(p.pending) ? p.pending.filter((x) => typeof x === 'string') : [],
          carried: p.carried === true,
        };
      },
    },
  ),
);

/**
 * Keep the design's tiers in step with the log, from now on. Before that,
 * once per device, carry any result the design holds that the log does not
 * into the log, so nothing marked before the log existed is lost. Returns a
 * function that stops it.
 */
export function startYardLog(): () => void {
  const log = useYardLog.getState();
  if (!log.carried) {
    const now = Date.now();
    const carried = entriesFromOverrides(useApp.getState().design.overrides, log.entries, now, localDate());
    useYardLog.setState({ entries: mergeLogs(log.entries, carried), carried: true });
  }

  const apply = () => {
    const { design } = useApp.getState();
    const overrides = applyLog(design.overrides, useYardLog.getState().entries);
    if (overrides !== design.overrides) useApp.setState({ design: { ...design, overrides } });
  };
  apply();
  const stopLog = useYardLog.subscribe((s, prev) => {
    if (s.entries !== prev.entries) apply();
  });
  // A design loaded from a file, or reset, gets the log's tiers back.
  const stopDesign = useApp.subscribe((s, prev) => {
    if (s.design.overrides !== prev.design.overrides) apply();
  });
  return () => {
    stopLog();
    stopDesign();
  };
}
