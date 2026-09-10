import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CATALOG, CATALOG_BY_ID } from '../engine/catalog';
import {
  createDefaultDesign, DESIGN_VERSION, makePlacement, newId, normalizeDesign,
} from '../engine/defaults';
import { effectiveSystem, simulate, type SimResult } from '../engine/simulate';
import { applyObservedClimate, type ObservedClimate } from '../engine/observed';
import type {
  Design, EvidenceTier, FeatureKind, ObservedClimateRecord, Placement, SiteFeature,
  SiteProfile, SiteZone, SystemDef, SystemOverride, ZoneKind,
} from '../engine/types';

export type Tab = 'site' | 'design' | 'results' | 'catalog';

interface AppState {
  design: Design;
  tab: Tab;
  selectedPlacementId: string | null;
  /** Only one of placement / feature / zone is ever selected. */
  selectedFeatureId: string | null;
  selectedZoneId: string | null;
  /** Shadow overlay: which month and hour to draw, and whether to show it. */
  shadows: { on: boolean; month: number; hour: number };
  inspectedSystemId: string | null;
  /** Canvas viewport: metres-per-pixel scale and pan offset in pixels. */
  view: { scale: number; x: number; y: number; fitted?: boolean };

  setTab: (tab: Tab) => void;
  select: (id: string | null) => void;
  inspect: (systemId: string | null) => void;
  setView: (view: Partial<AppState['view']>) => void;

  selectFeature: (id: string | null) => void;
  selectZone: (id: string | null) => void;
  setShadows: (patch: Partial<AppState['shadows']>) => void;

  addFeature: (kind: FeatureKind) => string;
  updateFeature: (id: string, patch: Partial<SiteFeature>) => void;
  removeFeature: (id: string) => void;

  addZone: (kind: ZoneKind) => string;
  updateZone: (id: string, patch: Partial<SiteZone>) => void;
  removeZone: (id: string) => void;

  addPlacement: (systemId: string, at?: { x: number; y: number }) => string;
  movePlacement: (id: string, x: number, y: number) => void;
  updatePlacement: (id: string, patch: Partial<Placement>) => void;
  removePlacement: (id: string) => void;

  setSite: (patch: Partial<SiteProfile>) => void;

  /** Keep a fetched climate for later, and switch between the ones kept. */
  saveClimate: (climate: ObservedClimate, name: string) => string;
  useClimate: (id: string) => void;
  renameClimate: (id: string, name: string) => void;
  removeClimate: (id: string) => void;
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
      selectedFeatureId: null,
      selectedZoneId: null,
      shadows: { on: false, month: 11, hour: 15 },
      inspectedSystemId: null,
      view: { scale: 14, x: 24, y: 24, fitted: false },

      setTab: (tab) => set({ tab }),
      select: (selectedPlacementId) =>
        set({ selectedPlacementId, selectedFeatureId: null, selectedZoneId: null }),
      selectFeature: (selectedFeatureId) =>
        set({ selectedFeatureId, selectedPlacementId: null, selectedZoneId: null }),
      selectZone: (selectedZoneId) =>
        set({ selectedZoneId, selectedPlacementId: null, selectedFeatureId: null }),
      setShadows: (patch) => set((s) => ({ shadows: { ...s.shadows, ...patch } })),

      addFeature: (kind) => {
        const spot = nextFreeSpot(get().design);
        const feature = { ...FEATURE_DEFAULTS[kind], id: newId('f'), kind, ...spot };
        set((s) => ({
          design: { ...s.design, features: [...s.design.features, feature] },
          selectedFeatureId: feature.id,
          selectedPlacementId: null,
          selectedZoneId: null,
        }));
        return feature.id;
      },
      updateFeature: (id, patch) =>
        set((s) => ({
          design: {
            ...s.design,
            features: s.design.features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          },
        })),
      removeFeature: (id) =>
        set((s) => ({
          design: { ...s.design, features: s.design.features.filter((f) => f.id !== id) },
          selectedFeatureId: s.selectedFeatureId === id ? null : s.selectedFeatureId,
        })),

      addZone: (kind) => {
        const spot = nextFreeSpot(get().design);
        const zone: SiteZone = { id: newId('z'), kind, w: 8, d: 6, ...spot };
        set((s) => ({
          design: { ...s.design, zones: [...s.design.zones, zone] },
          selectedZoneId: zone.id,
          selectedPlacementId: null,
          selectedFeatureId: null,
        }));
        return zone.id;
      },
      updateZone: (id, patch) =>
        set((s) => ({
          design: {
            ...s.design,
            zones: s.design.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
          },
        })),
      removeZone: (id) =>
        set((s) => ({
          design: { ...s.design, zones: s.design.zones.filter((z) => z.id !== id) },
          selectedZoneId: s.selectedZoneId === id ? null : s.selectedZoneId,
        })),
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

      saveClimate: (climate, name) => {
        const id = newId('c');
        const record: ObservedClimateRecord = { id, name, ...climate };
        set((s) => ({
          design: {
            ...applyObservedClimateToDesign(s.design, record),
            climates: [...s.design.climates, record],
          },
        }));
        return id;
      },

      useClimate: (id) =>
        set((s) => {
          const record = s.design.climates.find((c) => c.id === id);
          if (!record) return {};
          return { design: applyObservedClimateToDesign(s.design, record) };
        }),

      renameClimate: (id, name) =>
        set((s) => ({
          design: {
            ...s.design,
            climates: s.design.climates.map((c) => (c.id === id ? { ...c, name } : c)),
          },
        })),

      removeClimate: (id) =>
        set((s) => ({
          design: { ...s.design, climates: s.design.climates.filter((c) => c.id !== id) },
        })),

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
        selectedFeatureId: null,
        selectedZoneId: null,
        view: { scale: 14, x: 24, y: 24, fitted: false },
      }),
      loadDesign: (design) => set({
        design: normalizeDesign(design),
        selectedPlacementId: null, selectedFeatureId: null, selectedZoneId: null,
      }),
    }),
    {
      name: 'mmssim.design.v1',
      version: DESIGN_VERSION,
      partialize: (s) => ({ design: s.design, view: s.view, tab: s.tab }),
      /**
       * Runs when the stored version is behind. It normalises rather than
       * discarding, so a yard drawn six versions ago still opens.
       */
      migrate: (persisted) => {
        const state = persisted as { design?: unknown } | undefined;
        return { ...state, design: normalizeDesign(state?.design) } as never;
      },
      /**
       * And this runs on *every* load, version bump or not.
       *
       * `migrate` alone is not enough: it only fires when the stored version
       * differs, so a save written by a build that never set one — or one
       * corrupted by a half-finished write — sails straight through and
       * crashes the first component that maps over a field it lacks. That is a
       * blank page and someone's lost design, so the shape is guaranteed here
       * instead of hoped for.
       */
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...state,
          design: normalizeDesign(state.design),
          view: state.view ?? current.view,
          selectedPlacementId: null,
          selectedFeatureId: null,
          selectedZoneId: null,
        };
      },
    },
  ),
);

/** Apply a saved record to the design's site, keeping its name as the label. */
function applyObservedClimateToDesign(design: Design, record: ObservedClimateRecord): Design {
  const site = applyObservedClimate(design.site, record);
  return {
    ...design,
    site: { ...site, name: design.site.name, climateLabel: `${record.name} · ${site.climateLabel}` },
  };
}

/** Lay new things out on a loose grid so nothing lands exactly on top. */
function nextFreeSpot(design: Design): { x: number; y: number } {
  const n = design.placements.length + design.features.length + design.zones.length;
  const cols = 5;
  return { x: 2 + (n % cols) * 7, y: 2 + Math.floor(n / cols) * 7 };
}

/** Sensible starting dimensions for each kind of thing already on site. */
export const FEATURE_DEFAULTS: Record<
  FeatureKind, Omit<SiteFeature, 'id' | 'kind' | 'x' | 'y'>
> = {
  building: { w: 8, d: 6, heightM: 5, foliage: 'solid', occupiesGround: false, label: 'Building' },
  tree: { w: 6, d: 6, heightM: 8, foliage: 'deciduous', occupiesGround: true, label: 'Tree' },
  hedge: { w: 10, d: 1, heightM: 2, foliage: 'deciduous', occupiesGround: true, label: 'Hedge' },
  fence: { w: 10, d: 0.2, heightM: 1.8, foliage: 'solid', occupiesGround: false, label: 'Fence' },
  wall: { w: 8, d: 0.4, heightM: 2.2, foliage: 'solid', occupiesGround: false, label: 'Wall' },
  paving: { w: 5, d: 4, heightM: 0, foliage: 'solid', occupiesGround: true, label: 'Paving' },
};

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
