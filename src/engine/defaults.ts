import { DEFAULT_SITE } from './climate';
import type { Design, Placement } from './types';

export const DESIGN_VERSION = 1;

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
      makePlacement('roof-catchment', 60, 1, 1),
      makePlacement('solar-pv', 4, 10, 1),
      makePlacement('poly-tank', 5, 16.5, 1),
      makePlacement('annual-beds', 40, 1, 10.5),
      makePlacement('laying-hens', 6, 9.5, 10.5),
      makePlacement('compost-bays', 3, 14, 10.5),
    ],
    overrides: {},
    customSystems: [],
  };
}

export function emptyDesign(): Design {
  return {
    version: DESIGN_VERSION,
    site: { ...DEFAULT_SITE },
    placements: [],
    overrides: {},
    customSystems: [],
  };
}
