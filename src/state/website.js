import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendStatuses, statusesFor, statusSignature, SyncError, } from '../engine/websiteSync';
import { useApp } from './store';
export const useWebsite = create()(persist((set, get) => ({
    address: '',
    key: '',
    auto: true,
    lastSent: null,
    last: null,
    busy: false,
    retry: false,
    setConnection: (patch) => set((s) => {
        const moved = (patch.address !== undefined && patch.address !== s.address)
            || (patch.key !== undefined && patch.key !== s.key);
        // A different site or key has been told nothing yet.
        return { ...patch, ...(moved ? { lastSent: null, last: null, retry: false } : {}) };
    }),
    send: async (design, force = false) => {
        const { address, key, busy, lastSent } = get();
        if (!address.trim() || !key.trim() || busy)
            return;
        const statuses = statusesFor(design);
        const signature = statusSignature(statuses);
        if (!force && signature === lastSent)
            return;
        set({ busy: true });
        try {
            const reply = await sendStatuses(address, key, statuses);
            const n = reply.changed.length;
            set({
                lastSent: signature,
                retry: false,
                last: {
                    at: Date.now(),
                    ok: true,
                    changed: reply.changed,
                    message: n === 0
                        ? `${reply.site} is up to date.`
                        : `${n} ${n === 1 ? 'change' : 'changes'} on ${reply.site}.`,
                },
            });
        }
        catch (e) {
            const err = e instanceof SyncError ? e : new SyncError('Something went wrong sending to the website.', true);
            set({ retry: err.retry, last: { at: Date.now(), ok: false, message: err.message, changed: [] } });
        }
        finally {
            set({ busy: false });
        }
    },
}), {
    name: 'mmssim.website.v1',
    partialize: ({ address, key, auto, lastSent, last, retry }) => ({ address, key, auto, lastSent, last, retry }),
}));
/**
 * Send status changes on their own, a moment after the last edit, so marking
 * five systems in a row is one push rather than five. Also sends on start
 * (anything changed while this was closed) and when the device comes back
 * online after a failed send. Returns a function that stops it.
 */
export function startWebsiteSync(delayMs = 2500) {
    let timer;
    const sendSoon = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const w = useWebsite.getState();
            if (w.auto)
                void w.send(useApp.getState().design);
        }, delayMs);
    };
    const stopDesign = useApp.subscribe((s, prev) => {
        if (s.design.overrides !== prev.design.overrides
            || s.design.customSystems !== prev.design.customSystems)
            sendSoon();
    });
    // A new address or key has been told nothing: send once typing stops.
    const stopConnection = useWebsite.subscribe((s, prev) => {
        if (s.address !== prev.address || s.key !== prev.key)
            sendSoon();
    });
    const onOnline = () => {
        if (useWebsite.getState().retry)
            sendSoon();
    };
    window.addEventListener('online', onOnline);
    sendSoon();
    return () => {
        clearTimeout(timer);
        stopDesign();
        stopConnection();
        window.removeEventListener('online', onOnline);
    };
}
