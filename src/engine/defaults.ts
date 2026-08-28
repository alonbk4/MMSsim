import { DEFAULT_SITE } from './climate';
import type { Design, Placement } from './types';

export const DESIGN_VERSION = 2;

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
    overrides: {},
    customSystems: [],
  };
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
  };
}
