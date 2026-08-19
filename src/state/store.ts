import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CATALOG, CATALOG_BY_ID } from '../engine/catalog';
import { createDefaultDesign, DESIGN_VERSION, makePlacement } from '../engine/defaults';
import { effectiveSystem, simulate, type SimResult } from '../engine/simulate';
import type {
  Design, EvidenceTier, Placement, SiteProfile, SystemDef, SystemOverride,
} from '../engine/types';

export type Tab = 'site' | 'design' | 'results' | 'catalog';

interface AppState {
  design: Design;
  tab: Tab;
  selectedPlacementId: string | null;
  inspectedSystemId: string | null;
  /** Canvas viewport: metres-per-pixel scale and pan offset in pixels. */
  view: { scale: number; x: number; y: number; fitted?: boolean };

  setTab: (tab: Tab) => void;
  select: (id: string | null) => void;
  inspect: (systemId: string | null) => void;
  setView: (view: Partial<AppState['view']>) => void;

  addPlacement: (systemId: string, at?: { x: number; y: number }) => string;
  movePlacement: (id: string, x: number, y: number) => void;
  updatePlacement: (id: string, patch: Partial<Placement>) => void;
  removePlacement: (id: string) => void;

  setSite: (patch: Partial<SiteProfile>) => void;
  setOverride: (systemId: string, patch: SystemOverride | null) => void;
  promote: (systemId: string, tier: EvidenceTier) => void;

  reset: () => void;
  loadDesign: (design: Design) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      design: createDefaultDesign(),
      tab: 'design',
      selectedPlacementId: null,
      inspectedSystemId: null,
      view: { scale: 14, x: 24, y: 24, fitted: false },

      setTab: (tab) => set({ tab }),
      select: (selectedPlacementId) => set({ selectedPlacementId }),
      inspect: (inspectedSystemId) => set({ inspectedSystemId }),
      setView: (v) => set({ view: { ...get().view, ...v } }),

      addPlacement: (systemId, at) => {
        const def = CATALOG_BY_ID[systemId]
          ?? get().design.customSystems.find((s) => s.id === systemId);
        const units = def?.unitDefault ?? 1;
        const spot = at ?? nextFreeSpot(get().design);
        const placement = makePlacement(systemId, units, spot.x, spot.y);
        set((s) => ({
          design: { ...s.design, placements: [...s.design.placements, placement] },
          selectedPlacementId: placement.id,
        }));
        return placement.id;
      },

      movePlacement: (id, x, y) =>
        set((s) => ({
          design: {
            ...s.design,
            placements: s.design.placements.map((p) => (p.id === id ? { ...p, x, y } : p)),
          },
        })),

      updatePlacement: (id, patch) =>
        set((s) => ({
          design: {
            ...s.design,
            placements: s.design.placements.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        })),

      removePlacement: (id) =>
        set((s) => ({
          design: { ...s.design, placements: s.design.placements.filter((p) => p.id !== id) },
          selectedPlacementId: s.selectedPlacementId === id ? null : s.selectedPlacementId,
        })),

      setSite: (patch) =>
        set((s) => ({ design: { ...s.design, site: { ...s.design.site, ...patch } } })),

      setOverride: (systemId, patch) =>
        set((s) => {
          const overrides = { ...s.design.overrides };
          if (patch === null) delete overrides[systemId];
          else overrides[systemId] = { ...overrides[systemId], ...patch };
          return { design: { ...s.design, overrides } };
        }),

      promote: (systemId, tier) => get().setOverride(systemId, { evidence: tier }),

      reset: () => set({
        design: createDefaultDesign(),
        selectedPlacementId: null,
        view: { scale: 14, x: 24, y: 24, fitted: false },
      }),
      loadDesign: (design) => set({ design, selectedPlacementId: null }),
    }),
    {
      name: 'mmssim.design.v1',
      partialize: (s) => ({ design: s.design, view: s.view, tab: s.tab }),
      migrate: (persisted) => {
        const state = persisted as { design?: Design } | undefined;
        if (!state?.design || state.design.version !== DESIGN_VERSION) {
          return { design: createDefaultDesign() } as never;
        }
        return state as never;
      },
    },
  ),
);

/** Lay new systems out on a loose grid so nothing lands exactly on top. */
function nextFreeSpot(design: Design): { x: number; y: number } {
  const n = design.placements.length;
  const cols = 5;
  return { x: 2 + (n % cols) * 7, y: 2 + Math.floor(n / cols) * 7 };
}

/* ---------- derived selectors ---------- */

export function allSystems(design: Design): SystemDef[] {
  return [...CATALOG, ...design.customSystems].map((s) =>
    effectiveSystem(s, design.overrides[s.id]),
  );
}

export function systemById(design: Design, id: string): SystemDef | undefined {
  const base = CATALOG_BY_ID[id] ?? design.customSystems.find((s) => s.id === id);
  return base ? effectiveSystem(base, design.overrides[id]) : undefined;
}

/** Memoised on design identity — the store replaces `design` on every edit. */
let lastDesign: Design | null = null;
let lastResult: SimResult | null = null;

export function useSimulation(): SimResult {
  const design = useApp((s) => s.design);
  if (lastDesign !== design || !lastResult) {
    const byId: Record<string, SystemDef> = {};
    for (const s of CATALOG) byId[s.id] = s;
    for (const s of design.customSystems) byId[s.id] = s;
    lastResult = simulate(design, byId);
    lastDesign = design;
  }
  return lastResult;
}
