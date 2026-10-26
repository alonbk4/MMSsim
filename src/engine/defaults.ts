import { CLIMATE_PRESETS, DEFAULT_SITE } from './climate';
import { isEvidenceTier } from './resources';
import { ANN_ARBOR } from './data/observed/ann-arbor';
import type { Design, Placement, SiteProfile, SystemOverride } from './types';

export const DESIGN_VERSION = 5;

let seq = 0;
export function newId(prefix = 'p'): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export function makePlacement(systemId: string, units: number, x: number, y: number): Placement {
  return { id: newId(), systemId, units, x, y, enabled: true };
}

/**
 * A deliberately partial starting design: enough on the board to show what the
 * engine does, obviously incomplete so the first thing you see is a set of real
 * gaps rather than a solved puzzle.
 */
export function createDefaultDesign(): Design {
  return {
    version: DESIGN_VERSION,
    site: { ...DEFAULT_SITE },
    placements: [
      // Catchment sits on the house roof, which is where it would be.
      makePlacement('roof-catchment', 60, 1, 1),
      makePlacement('solar-pv', 4, 13.5, 1),
      makePlacement('poly-tank', 5, 13.5, 5.5),
      makePlacement('annual-beds', 40, 1, 11),
      makePlacement('laying-hens', 6, 13, 11),
      makePlacement('compost-bays', 3, 13, 15),
    ],
    features: [
      // A neighbour's wall on the shady side, so the shade model has something
      // to say from the first run rather than looking like decoration.
      {
        id: 'f_boundary', kind: 'fence', label: 'Boundary fence',
        x: 0, y: 27.5, w: 20, d: 0.3, heightM: 1.8,
        foliage: 'solid', occupiesGround: false,
      },
    ],
    zones: [],
    // No tested tiers: those come from the person's own yard log. Starting
    // anyone with another yard's results would be claiming them for them.
    overrides: {},
    customSystems: [],
    climates: [{ id: 'c_ann_arbor', name: 'Ann Arbor, MI', ...ANN_ARBOR }],
  };
}

/**
 * Bring a design saved by an older version up to date, keeping the yard.
 *
 * Fields have been added several times — features, zones, climate records,
 * latitude, slope — and a design stored before any of them arrives here
 * missing those keys. Code that maps over `design.features` then throws before
 * React renders anything, which is a blank page and a lost design.
 *
 * So this fills the gaps rather than checking a version number and starting
 * over: whatever the user actually drew is preserved, and only what is absent
 * is supplied. It is deliberately tolerant of shapes that never shipped.
 */
export function normalizeDesign(raw: unknown): Design {
  const fallback = createDefaultDesign();
  if (!raw || typeof raw !== 'object') return fallback;
  const d = raw as Partial<Design> & Record<string, unknown>;
  if (!Array.isArray(d.placements)) return fallback;

  const overrides = normalizeOverrides(d.overrides);

  return {
    version: DESIGN_VERSION,
    site: normalizeSite(d.site),
    placements: d.placements.filter((p) => p && typeof p.systemId === 'string').map((p) => ({
      ...p,
      enabled: p.enabled !== false,
      units: Number.isFinite(p.units) ? p.units : 1,
      x: Number.isFinite(p.x) ? p.x : 0,
      y: Number.isFinite(p.y) ? p.y : 0,
    })),
    features: Array.isArray(d.features) ? d.features : [],
    zones: Array.isArray(d.zones) ? d.zones : [],
    climates: Array.isArray(d.climates) ? d.climates : fallback.climates,
    overrides,
    customSystems: Array.isArray(d.customSystems) ? d.customSystems : [],
  };
}

/**
 * `proven` was one tier before it was split into what actually happened when
 * you tried it. A save that still says so means it worked.
 */
function normalizeOverrides(raw: unknown): Design['overrides'] {
  if (!raw || typeof raw !== 'object') return {};
  const out: Design['overrides'] = {};
  for (const [id, ov] of Object.entries(raw as Record<string, SystemOverride>)) {
    if (!ov || typeof ov !== 'object') continue;
    const raw = ov.evidence as string | undefined;
    const evidence = raw === 'proven' ? 'testedSuccess'
      : isEvidenceTier(raw) ? raw
      : undefined;
    out[id] = evidence ? { ...ov, evidence } : { ...ov, evidence: undefined };
  }
  return out;
}

/**
 * Fill in a site profile from an older save.
 *
 * The one judgement call: a design stored before latitude existed should get
 * the latitude of the climate it was already using, not the latitude of
 * whatever the app now starts on — otherwise a temperate-oceanic garden would
 * silently relocate to Michigan.
 */
function normalizeSite(raw: unknown): SiteProfile {
  const base = DEFAULT_SITE;
  if (!raw || typeof raw !== 'object') return { ...base };
  const s = raw as Partial<SiteProfile>;

  const twelve = (v: unknown, fb: number[]) =>
    (Array.isArray(v) && v.length === 12 && v.every((n) => typeof n === 'number' && isFinite(n))
      ? (v as number[]) : fb);
  const num = (v: unknown, fb: number) => (typeof v === 'number' && isFinite(v) ? v : fb);

  const preset = CLIMATE_PRESETS.find((p) => p.id === s.climate);
  const presetLatitude = preset ? preset.refLatitude : base.latitude;
  const hadObserved = Array.isArray(s.observedPeakSunHours);

  const site: SiteProfile = {
    ...base,
    ...s,
    name: typeof s.name === 'string' ? s.name : base.name,
    climate: s.climate ?? base.climate,
    latitude: num(s.latitude, presetLatitude),
    rainfallShape: twelve(s.rainfallShape, base.rainfallShape),
    peakSunHours: twelve(s.peakSunHours, base.peakSunHours),
    meanTempC: twelve(s.meanTempC, base.meanTempC),
    etoMm: twelve(s.etoMm, base.etoMm),
    annualRainfallMm: num(s.annualRainfallMm, base.annualRainfallMm),
    lotAreaM2: num(s.lotAreaM2, base.lotAreaM2),
    lotWidthM: num(s.lotWidthM, base.lotWidthM),
    roofAreaM2: num(s.roofAreaM2, base.roofAreaM2),
    houseX: num(s.houseX, base.houseX),
    houseY: num(s.houseY, base.houseY),
    houseHeightM: num(s.houseHeightM, base.houseHeightM),
    slopePercent: num(s.slopePercent, 0),
    slopeAspect: num(s.slopeAspect, base.slopeAspect),
    household: num(s.household, base.household),
    soil: s.soil ?? base.soil,
    // A save from before observed records existed is running on a preset,
    // whatever the current default happens to be.
    climateSource: s.climateSource ?? (hadObserved ? 'observed' : 'preset'),
  };
  if (!hadObserved) {
    delete site.observedPeakSunHours;
    delete site.observedLatitude;
  }
  return site;
}

export function emptyDesign(): Design {
  return {
    version: DESIGN_VERSION,
    site: { ...DEFAULT_SITE },
    placements: [],
    features: [],
    zones: [],
    overrides: {},
    customSystems: [],
    climates: [],
  };
}
