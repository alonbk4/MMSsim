import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  statusesFor, statusSignature, SyncError, syncWithSite, uploadPhoto, type SyncChange,
} from '../engine/websiteSync';
import type { Design } from '../engine/types';
import { logSignature } from '../engine/yardLog';
import { forgetPhoto, keptPhoto } from './photos';
import { useApp } from './store';
import { useYardLog } from './yardLog';

/**
 * The connection to the yard's website, and what it was last told.
 *
 * Kept apart from the design on purpose: an exported design is a file
 * people pass around, and the key in here can change what the website says.
 */

/** Everything a sync would send, as one string: unchanged means nothing to send. */
export function syncSignature(design: Design): string {
  const log = useYardLog.getState();
  return [statusSignature(statusesFor(design)), logSignature(log.entries), log.pending.join(',')].join('#');
}
export interface LastSend {
  at: number;
  ok: boolean;
  message: string;
  changed: SyncChange[];
}

interface WebsiteState {
  address: string;
  key: string;
  auto: boolean;
  /** Signature of the statuses and log the website last accepted. */
  lastSent: string | null;
  last: LastSend | null;
  busy: boolean;
  /** A send failed in a way that could work later (offline, site down). */
  retry: boolean;

  setConnection: (patch: Partial<Pick<WebsiteState, 'address' | 'key' | 'auto'>>) => void;
  /**
   * Send if anything changed since the last accepted send, or always if
   * forced, which is also how this device hears about other devices' entries.
   */
  send: (design: Design, force?: boolean) => Promise<void>;
}

export const useWebsite = create<WebsiteState>()(
  persist(
    (set, get) => ({
      address: '',
      key: '',
      auto: true,
      lastSent: null,
      last: null,
      busy: false,
      retry: false,

      setConnection: (patch) =>
        set((s) => {
          const moved = (patch.address !== undefined && patch.address !== s.address)
            || (patch.key !== undefined && patch.key !== s.key);
          // A different site or key has been told nothing yet.
          return { ...patch, ...(moved ? { lastSent: null, last: null, retry: false } : {}) };
        }),

      send: async (design, force = false) => {
        const { address, key, busy, lastSent } = get();
        if (!address.trim() || !key.trim() || busy) return;
        if (!force && syncSignature(design) === lastSent) return;

        set({ busy: true });
        try {
          // Photos first, so each entry goes with its photo. One that cannot
          // go now stays queued and does not hold up the rest of the sync.
          let photoTrouble = '';
          for (const id of [...useYardLog.getState().pending]) {
            const entry = useYardLog.getState().entries.find((e) => e.id === id);
            const blob = await keptPhoto(id);
            if (!entry || entry.deleted || !blob) {
              useYardLog.getState().dropPending(id);
              continue;
            }
            try {
              useYardLog.getState().photoSent(id, await uploadPhoto(address, key, id, blob));
              void forgetPhoto(id);
            } catch (e) {
              // A refused key fails the sync below too, and says so there.
              photoTrouble = e instanceof Error ? e.message : 'A photo didn’t send.';
              break;
            }
          }

          const reply = await syncWithSite(
            address, key, statusesFor(useApp.getState().design), useYardLog.getState().entries,
          );
          useYardLog.getState().mergeFromSite(reply.entries);

          const parts: string[] = [];
          if (reply.saved) parts.push(`${reply.saved} log ${reply.saved === 1 ? 'entry' : 'entries'} saved`);
          if (reply.changed.length) parts.push(`${reply.changed.length} ${reply.changed.length === 1 ? 'change' : 'changes'}`);
          const waiting = useYardLog.getState().pending.length;
          set({
            // Taken after the merge, which may have changed the design's
            // tiers, so the next check finds nothing new to send.
            lastSent: syncSignature(useApp.getState().design),
            retry: waiting > 0,
            last: {
              at: Date.now(),
              ok: !photoTrouble,
              changed: reply.changed,
              message: (parts.length ? `${parts.join(', ')} on ${reply.site}.` : `${reply.site} is up to date.`)
                + (photoTrouble ? ` ${waiting === 1 ? 'A photo is' : `${waiting} photos are`} still waiting: ${photoTrouble}` : ''),
            },
          });
        } catch (e) {
          const err = e instanceof SyncError ? e : new SyncError('Something went wrong sending to the website.', true);
          set({ retry: err.retry, last: { at: Date.now(), ok: false, message: err.message, changed: [] } });
        } finally {
          set({ busy: false });
        }
      },
    }),
    {
      name: 'mmssim.website.v1',
      partialize: ({ address, key, auto, lastSent, last, retry }) => ({ address, key, auto, lastSent, last, retry }),
    },
  ),
);

/**
 * Sync on its own: a moment after the last edit, so marking five systems in
 * a row is one push rather than five; on start, and whenever the app comes
 * back into view after a minute away, to pick up entries made on other
 * devices; and when the device comes back online after a failed send.
 * Returns a function that stops it.
 */
export function startWebsiteSync(delayMs = 2500): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let force = false;
  const sendSoon = (pull = false) => {
    force ||= pull;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const w = useWebsite.getState();
      if (w.auto) void w.send(useApp.getState().design, force);
      force = false;
    }, delayMs);
  };

  const stopDesign = useApp.subscribe((s, prev) => {
    if (s.design.overrides !== prev.design.overrides
      || s.design.customSystems !== prev.design.customSystems) sendSoon();
  });
  const stopLog = useYardLog.subscribe((s, prev) => {
    if (s.entries !== prev.entries || s.pending !== prev.pending) sendSoon();
  });
  const stopConnection = useWebsite.subscribe((s, prev) => {
    // A new address or key has been told nothing: send once typing stops.
    if (s.address !== prev.address || s.key !== prev.key) sendSoon(true);
    // An edit made while a sync was under way (a photo can take a while) was
    // turned away as busy: send it now. Not after a failure, or it would loop.
    else if (prev.busy && !s.busy && s.last?.ok
      && syncSignature(useApp.getState().design) !== s.lastSent) sendSoon();
  });
  const onOnline = () => {
    if (useWebsite.getState().retry) sendSoon(true);
  };
  const onVisible = () => {
    const last = useWebsite.getState().last?.at ?? 0;
    if (document.visibilityState === 'visible' && Date.now() - last > 60_000) sendSoon(true);
  };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  sendSoon(true);

  return () => {
    clearTimeout(timer);
    stopDesign();
    stopLog();
    stopConnection();
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
