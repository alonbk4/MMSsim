/**
 * Per-system marks.
 *
 * The canvas previously had six glyphs — one per category — so every water
 * system looked like every other water system. These are authored on a 24×24
 * grid and scaled into metre space, small enough to read at a glance and
 * simple enough to survive being drawn 3 mm wide.
 *
 * Anything without its own mark falls back to its category's, so a
 * user-authored system still draws something sensible.
 */
import type { ReactNode } from 'react';
import type { SystemCategory, SystemDef } from '../../engine/types';

const G: Record<string, ReactNode> = {
  /* ---- water ---- */
  tank: <><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M5 13c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
  droplet: <path d="M12 3s6 6.4 6 10.2A6 6 0 0 1 6 13.2C6 9.4 12 3 12 3z" />,
  gutter: <><path d="M3 8h18" /><path d="M3 8v3h18V8" /><path d="M8 11v6M16 11v9" /></>,
  funnel: <><path d="M4 4h16l-6 7v8l-4 2v-10z" /></>,
  waves: <><path d="M3 9q3-2.2 6 0t6 0 6 0" /><path d="M3 14q3-2.2 6 0t6 0 6 0" /><path d="M3 19q3-2.2 6 0t6 0 6 0" /></>,
  well: <><path d="M6 10h12v10H6z" /><path d="M4 10 12 4l8 6" /><path d="M12 10v10" /></>,
  contour: <><path d="M2 8q5-4 10 0t10 0" /><path d="M2 14q5-4 10 0t10 0" /><path d="M7 6v4M17 12v4" /></>,
  mist: <><path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeDasharray="2 2.5" /></>,
  dripline: <><path d="M3 7h18" /><path d="M7 7v4M12 7v4M17 7v4" /><circle cx="7" cy="14" r="1.4" /><circle cx="12" cy="14" r="1.4" /><circle cx="17" cy="14" r="1.4" /></>,

  /* ---- energy ---- */
  panel: <><path d="M3 6h18l-2 10H5z" /><path d="M8 6l-1 10M16 6l1 10M4.4 11h15.2" /><path d="M12 16v4" /></>,
  battery: <><rect x="3" y="8" width="16" height="9" rx="1.6" /><path d="M19 11h2v3h-2" /><path d="M7 11v3M11 11v3M15 11v3" /></>,
  collector: <><rect x="3" y="7" width="18" height="10" rx="1.4" /><path d="M7 7v10M12 7v10M17 7v10" /><circle cx="19" cy="4" r="2" /></>,
  flame: <><path d="M12 3c3 4 5 5.6 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 .4 1.4 1 2 2 2 0-3-1-5 1-7z" /><path d="M5 21h14" /></>,
  coppice: <><path d="M6 21V9M12 21V5M18 21v-9" /><path d="M6 9 3 6M6 9l3-3M12 5 9 2M12 5l3-3M18 12l-3-3M18 12l3-3" /></>,
  turbine: <><circle cx="12" cy="9" r="1.6" /><path d="M12 7.4V2M13.4 9.9l4.6 2.7M10.6 9.9 6 12.6" /><path d="M12 21v-9" /></>,
  digester: <><ellipse cx="12" cy="14" rx="8" ry="6" /><path d="M12 8V4M10 4h4" /><circle cx="9" cy="13" r="1" /><circle cx="14" cy="15" r="1.3" /></>,
  dryer: <><path d="M3 16 12 6l9 10z" /><path d="M6.5 13h11" /><path d="M12 19v2" /></>,
  gasifier: <><rect x="6" y="8" width="10" height="12" rx="1.4" /><path d="M16 12h4v8" /><path d="M9 8V5M13 8V5" /></>,

  /* ---- food ---- */
  leaf: <><path d="M20 4c0 9-5.5 14-13 14 0-8 5-14 13-14z" /><path d="M4 20c4-4 8-7 12-9" /></>,
  tuber: <><ellipse cx="12" cy="14" rx="7" ry="5" /><circle cx="9.5" cy="13" r=".9" /><circle cx="14" cy="15.5" r=".8" /><path d="M12 9V5M12 5l3-2M12 5 9 3.4" /></>,
  squash: <><ellipse cx="12" cy="14" rx="7.5" ry="6" /><path d="M8.5 8.6v10.8M15.5 8.6v10.8" /><path d="M12 8V5" /></>,
  tree: <><circle cx="12" cy="9" r="6" /><path d="M12 15v6M12 18l-3-2M12 17.5l3-2.2" /></>,
  berry: <><circle cx="8" cy="13" r="3" /><circle cx="15" cy="15" r="2.6" /><path d="M8 10V6M15 12.4V8M6 6h4M13 8h4" /></>,
  hen: <><path d="M7 19c-2 0-4-1.8-4-4.4C3 11 6 9 9 9h4l3-3v3.4c2 .8 3 2.4 3 4.2 0 3-2.4 5.4-6 5.4z" /><circle cx="15.4" cy="8.6" r=".7" fill="currentColor" stroke="none" /><path d="M8 19v2M14 19v2" /></>,
  rabbit: <><ellipse cx="13" cy="15" rx="6" ry="4.6" /><path d="M9 11 6.5 4.5M12 10.6 12.4 4" /><circle cx="17.6" cy="14" r=".7" fill="currentColor" stroke="none" /></>,
  duck: <><path d="M5 18c0-3.6 3-6.4 6.6-6.4h3.6V9a3 3 0 1 1 3 3v2c0 2.6-2.2 4.6-5 4.6z" /><path d="M20.4 10.4h2.4" /></>,
  bee: <><path d="M12 4 8 8.5h8z" /><path d="M6 10h12v5a6 6 0 0 1-12 0z" /><path d="M6 13h12M8 17h8" /></>,
  mushroom: <><path d="M3.5 11a8.5 6 0 0 1 17 0z" /><path d="M9.5 11v6a2.5 2.5 0 0 0 5 0v-6" /></>,
  fish: <><path d="M3 12c3.6-4.4 9-6 13-4l4-2-1.4 5.4L20 17l-4-2c-4 2-9.4.4-13-3z" /><circle cx="8" cy="10.6" r=".8" fill="currentColor" stroke="none" /></>,
  tunnel: <><path d="M3 20V12a9 8 0 0 1 18 0v8z" /><path d="M8 20v-8.6M16 20v-8.6M3 15.4h18" /></>,
  tray: <><rect x="3" y="9" width="18" height="8" rx="1.4" /><path d="M7 9V6M12 9V5M17 9V6" /></>,
  cellar: <><path d="M3 12 12 5l9 7" /><path d="M6 12v8h12v-8" /><path d="M10 20v-5h4v5" /></>,
  larva: <><path d="M4 14q2-3 4 0t4 0 4 0 4 0" /><circle cx="19.4" cy="12.6" r="1.4" /></>,
  duckweed: <><circle cx="8" cy="10" r="2.6" /><circle cx="14.5" cy="8.4" r="2" /><circle cx="12" cy="14" r="2.8" /><path d="M3 19h18" /></>,

  /* ---- sanitation / soil ---- */
  toilet: <><path d="M6 4h11l-1 7H7z" /><path d="M7 11c-1 4 0 6.6 5 9 5-2.4 6-5 5-9" /></>,
  bucket: <><path d="M5 8h14l-1.6 12H6.6z" /><path d="M8 8a4 4 0 0 1 8 0" /></>,
  drainfield: <><path d="M3 6h18M3 12h18M3 18h18" /><path d="M6 6v12M12 6v12M18 6v12" strokeDasharray="2 2" /></>,
  compost: <><path d="M12 4a8 8 0 0 1 7.4 5" /><path d="M19.6 4.6 19.4 9l-4.4-.4" /><path d="M12 20a8 8 0 0 1-7.4-5" /><path d="M4.4 19.4 4.6 15l4.4.4" /></>,
  worm: <><path d="M5 16q2.4-4 4.8 0t4.8 0 4.8 0" /><path d="M5 16v2M19.4 16v2" /></>,
  comfrey: <><path d="M12 21V9" /><path d="M12 12c-4 0-6-2-6-5 3 0 6 1.6 6 5z" /><path d="M12 10c4 0 6-2 6-5-3 0-6 1.6-6 5z" /></>,
  covercrop: <><path d="M4 20c0-4 2-7 4-7M10 20c0-5 2-8 4-8M16 20c0-4 2-6 4-6" /><path d="M3 20h18" /></>,
  kiln: <><path d="M6 20 9 8h6l3 12z" /><path d="M10 8V5h4v3" /><path d="M8 15h8" /></>,

  /* ---- shelter ---- */
  greenhouse: <><path d="M3 20V11l9-6 9 6v9z" /><path d="M12 5v15M3 11h18M7.5 8.3v11.7M16.5 8.3v11.7" /></>,
  wall: <><path d="M4 4h16v16H4z" /><path d="M4 9.3h16M4 14.6h16M9.3 4v5.3M14.6 9.3v5.3M9.3 14.6V20" /></>,
  pergola: <><path d="M3 7h18" /><path d="M5 7v13M19 7v13" /><path d="M8 7v4M12 7v4M16 7v4" /></>,
  pond: <><path d="M3 13q2.6-5 6-2.6t6-1.4 6 1.6" /><path d="M4 17q2.6-3.4 6-1.6t6-1 5 1" /></>,
};

/** Which mark each system uses. Unlisted ids fall back to the category mark. */
const BY_SYSTEM: Record<string, string> = {
  'roof-catchment': 'gutter',
  'poly-tank': 'tank',
  'ferrocement-cistern': 'tank',
  'swale-berm': 'contour',
  'greywater-branched-drain': 'dripline',
  'constructed-wetland': 'waves',
  'slow-sand-filter': 'funnel',
  'uv-ro-treatment': 'funnel',
  'drip-irrigation': 'dripline',
  'sheet-mulch': 'covercrop',
  'hand-well': 'well',
  'atmospheric-water': 'droplet',
  'fog-net': 'mist',

  'solar-pv': 'panel',
  'battery-bank': 'battery',
  'solar-thermal': 'collector',
  'rocket-mass-heater': 'flame',
  'coppice-woodlot': 'coppice',
  'solar-dehydrator': 'dryer',
  'biogas-digester': 'digester',
  'micro-wind': 'turbine',
  'micro-hydro': 'waves',
  'wood-gasifier': 'gasifier',

  'annual-beds': 'leaf',
  'staple-potato-bed': 'tuber',
  'winter-squash': 'squash',
  'biointensive-bed': 'leaf',
  'hugelkultur': 'coppice',
  'polytunnel': 'tunnel',
  'food-forest': 'tree',
  'fruit-trees': 'tree',
  'berry-hedge': 'berry',
  'laying-hens': 'hen',
  'meat-rabbits': 'rabbit',
  'ducks': 'duck',
  'beehive': 'bee',
  'mushroom-logs': 'mushroom',
  'aquaponics': 'fish',
  'root-cellar': 'cellar',
  'bsf-larvae': 'larva',
  'fodder-sprouts': 'tray',
  'duckweed-pond': 'duckweed',

  'composting-toilet': 'toilet',
  'humanure-system': 'bucket',
  'septic-leachfield': 'drainfield',
  'worm-flush-toilet': 'worm',

  'compost-bays': 'compost',
  'vermicompost': 'worm',
  'chop-and-drop': 'comfrey',
  'cover-crop': 'covercrop',
  'biochar-kiln': 'kiln',
  'bokashi': 'bucket',

  'attached-greenhouse': 'greenhouse',
  'thermal-mass-wall': 'wall',
  'shade-structure': 'pergola',
  'water-pond': 'pond',
};

const BY_CATEGORY: Record<SystemCategory, string> = {
  water: 'droplet',
  food: 'leaf',
  energy: 'flame',
  sanitation: 'toilet',
  soil: 'compost',
  shelter: 'greenhouse',
};

export function glyphNameFor(def: SystemDef): string {
  return BY_SYSTEM[def.id] ?? BY_CATEGORY[def.category];
}

/**
 * Draw a system's mark centred in a footprint of `w` × `h` metres.
 * `badge` puts a soft disc behind it, which the illustrated style wants and
 * the drafting style does not.
 */
export function PlanGlyph({
  def, w, h, tone, hidden, badge, scale,
}: {
  def: SystemDef; w: number; h: number; tone: string;
  hidden?: boolean; badge?: boolean;
  /** Pixels per metre, so the mark can move aside when a label appears. */
  scale?: number;
}) {
  if (hidden) return null;
  const short = Math.min(w, h);
  // Below about a metre and a half the mark turns to mud; leave it out.
  if (short < 1.5) return null;

  // The canvas prints a name across the middle of anything this big, so the
  // mark steps into a corner rather than sitting under the text.
  const labelled = scale !== undefined && short * scale > 52;
  const size = Math.min(short * (labelled ? 0.34 : 0.52), labelled ? 1.9 : 2.6);
  const pad = size * 0.22;
  const x = labelled ? pad : (w - size) / 2;
  const y = labelled ? pad : (h - size) / 2;
  const paths = G[glyphNameFor(def)] ?? G.leaf;
  return (
    <g transform={`translate(${x.toFixed(3)},${y.toFixed(3)}) scale(${(size / 24).toFixed(5)})`}>
      {badge && <circle cx="12" cy="12" r="11.5" fill="var(--surface-1)" opacity="0.6" />}
      <g
        fill="none" stroke={tone} strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9"
      >
        {paths}
      </g>
    </g>
  );
}

/** Flat list of every mark, for the icon sheet in the catalog later. */
export const GLYPH_NAMES = Object.keys(G);
