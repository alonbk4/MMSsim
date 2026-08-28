/**
 * Core domain types for the yard-systems simulator.
 *
 * The model is deliberately data-driven: every system is a plain serialisable
 * object so the app can ship a starter catalog, let the user override any
 * number with what they actually measured in their own yard, and persist the
 * result to localStorage without any code changes.
 */

/** Resources that move between systems, the household and the outside world. */
export type ResourceId =
  | 'waterPotable'
  | 'waterIrrigation'
  | 'greywater'
  | 'blackwater'
  | 'electricity'
  | 'heat'
  | 'foodCalories'
  | 'foodProtein'
  | 'compost'
  | 'organicWaste'
  | 'animalFeed'
  | 'biomass'
  | 'labor';

export interface ResourceMeta {
  id: ResourceId;
  label: string;
  /** Unit the engine accumulates in, per month. */
  unit: string;
  /** Short unit for dense readouts. */
  shortUnit: string;
  /**
   * A "goal" resource is something the household needs covered, so it gets a
   * self-sufficiency score. A non-goal resource (greywater, organic waste) is
   * a by-product: having a surplus is not a failure, it is just unused output.
   */
  goal: boolean;
  /** Byproducts are things the household emits that systems can consume. */
  byproduct: boolean;
  category: 'water' | 'energy' | 'food' | 'nutrient' | 'effort';
}

/**
 * Confidence tiers. This is the whole point of the app for a yard where some
 * systems are built and measured and others are just plausible reading.
 *
 * - `proven`       you have run it here and the numbers come from your site
 * - `researched`   documented elsewhere, credible, not yet verified here
 * - `experimental` speculative or contested; shown, but never counted as fact
 */
export type EvidenceTier = 'proven' | 'researched' | 'experimental';

export interface EvidenceMeta {
  tier: EvidenceTier;
  label: string;
  blurb: string;
  /** Multiplicative uncertainty band applied to this system's outputs. */
  low: number;
  high: number;
}

export type SystemCategory =
  | 'water'
  | 'food'
  | 'energy'
  | 'sanitation'
  | 'soil'
  | 'shelter';

/** Where a system can physically go. Used for siting warnings on the canvas. */
export type SitingTag =
  | 'roof'
  | 'fullSun'
  | 'partShade'
  | 'lowPoint'
  | 'nearHouse'
  | 'indoor'
  | 'openGround';

/**
 * Monthly driver series derived from the site profile. Each is 12 numbers,
 * January first. Flows reference these by id so a system's output responds to
 * climate instead of being a flat annual average.
 */
export type DriverId =
  | 'daysInMonth'
  | 'rainfallMm'
  | 'peakSunHours'
  | 'growingShare'
  | 'irrigationDemandPerM2'
  | 'runoffMm'
  | 'heatingDegreeDays';

export type Rate =
  /** Flat amount per unit, every month. */
  | { kind: 'constant'; perUnitPerMonth: number }
  /** Annual amount per unit, spread across the year by a seasonality profile. */
  | { kind: 'annual'; perUnitPerYear: number; season: SeasonProfileId }
  /** Driven by climate: driverValue * coefficient * units. */
  | { kind: 'driver'; driver: DriverId; coefficient: number };

export type SeasonProfileId = 'flat' | 'growing' | 'summer' | 'winter';

export interface Flow {
  resource: ResourceId;
  direction: 'produce' | 'consume';
  rate: Rate;
  /**
   * When true this input is not required for the system to run — it will
   * consume it if available but is not derated when it is missing.
   * (A compost pile wants kitchen scraps; a garden bed truly needs water.)
   */
  optional?: boolean;
}

export interface StorageSpec {
  resource: ResourceId;
  /** Capacity added per unit of the system, in the resource's monthly unit. */
  capacityPerUnit: number;
}

export interface SystemDef {
  id: string;
  name: string;
  category: SystemCategory;
  evidence: EvidenceTier;
  summary: string;
  /** What one "unit" of this system is, e.g. "m² of roof", "hen", "kW". */
  unitLabel: string;
  unitDefault: number;
  unitMin: number;
  unitMax: number;
  unitStep: number;
  /** Yard area consumed per unit, m². Roof-mounted systems are 0. */
  footprintPerUnit: number;
  /** Roof area consumed per unit, m². Ground-mounted systems are 0. */
  roofFootprintPerUnit?: number;
  siting: SitingTag[];
  capitalPerUnit: number;
  /** Recurring cash cost per unit per month (feed, filters, fuel). */
  upkeepCostPerUnitPerMonth: number;
  flows: Flow[];
  storage?: StorageSpec;
  /**
   * How much this system's output depends on direct sun, 0 to 1. Panels are 1:
   * shade them and they stop. Vegetables are lower, because plants trade shade
   * for slower growth rather than switching off. Omitted means unaffected — a
   * water tank does not care.
   */
  sunSensitivity?: number;
  /** Why it is in the tier it is in, and what would move it up a tier. */
  notes: string;
  /** Free-text provenance. For `proven` systems this is your own record. */
  sources: string[];
}

/**
 * Something already on the site that the design has to live with.
 *
 * Covers both the things that block sun — the neighbour's house, a boundary
 * fence, a mature oak — and the things that merely occupy ground, like a patio.
 * They produce nothing. They are a constraint, not a system.
 */
export type FeatureKind =
  | 'building'
  | 'fence'
  | 'hedge'
  | 'tree'
  | 'wall'
  | 'paving';

/** How much light a feature stops. Bare winter branches stop far less. */
export type Foliage = 'solid' | 'evergreen' | 'deciduous';

export interface SiteFeature {
  id: string;
  kind: FeatureKind;
  label?: string;
  /** Top-left of the footprint, metres. A tree is a circle in this box. */
  x: number;
  y: number;
  w: number;
  d: number;
  heightM: number;
  foliage: Foliage;
  /**
   * Whether it eats into the yard's usable area. A neighbour's building over
   * the boundary shades you without costing you ground.
   */
  occupiesGround: boolean;
}

/** Ground that behaves differently, and that the design should respect. */
export type ZoneKind = 'wet' | 'dry' | 'rocky' | 'frostPocket' | 'offLimits';

export interface SiteZone {
  id: string;
  kind: ZoneKind;
  label?: string;
  x: number;
  y: number;
  w: number;
  d: number;
}

/** A system dropped onto the yard. */
export interface Placement {
  id: string;
  systemId: string;
  /** Yard coordinates in metres, top-left origin. */
  x: number;
  y: number;
  units: number;
  /** User label, e.g. "north bed". */
  label?: string;
  enabled: boolean;
}

export type ClimatePresetId =
  | 'mediterranean'
  | 'temperateOceanic'
  | 'humidSubtropical'
  | 'coldContinental'
  | 'aridDesert'
  | 'tropicalWetDry'
  | 'custom';

export interface SiteProfile {
  name: string;
  climate: ClimatePresetId;
  /**
   * Degrees north (positive) or south (negative). Drives the sun: how high it
   * gets, how long the day is, and how much energy reaches the ground before
   * cloud is accounted for.
   */
  latitude: number;
  /** Total annual rainfall, mm. Scales the preset's monthly distribution. */
  annualRainfallMm: number;
  /** Monthly rainfall distribution as fractions summing to 1. */
  rainfallShape: number[];
  /** Mean daily peak-sun-hours per month (kWh/m²/day equivalent). */
  peakSunHours: number[];
  /** Mean monthly air temperature, °C — drives growing season and heating. */
  meanTempC: number[];
  /** Reference evapotranspiration, mm/month. Drives irrigation demand. */
  etoMm: number[];
  /** Usable yard area, m². */
  lotAreaM2: number;
  /** Width of the lot in metres; depth is derived from the area. */
  lotWidthM: number;
  /** Roof area available for catchment/PV, m². Also sets the drawn house. */
  roofAreaM2: number;
  /** Where the house sits on the plan, metres from the lot's top-left. */
  houseX: number;
  houseY: number;
  household: number;
  /** Litres of potable-grade water per person per day. */
  waterUsePerPersonLPerDay: number;
  /** kWh of electricity per person per day. */
  electricityPerPersonKwhPerDay: number;
  /** kcal per person per day. */
  caloriesPerPersonPerDay: number;
  /** Protein, kg per person per month. */
  proteinPerPersonKgPerMonth: number;
  /** Fraction of household water that leaves as reusable greywater. */
  greywaterFraction: number;
  /** Soil infiltration, affects earthworks. */
  soil: 'sand' | 'loam' | 'clay';
  /** Fall of the ground, percent (rise over run × 100). Zero is flat. */
  slopePercent: number;
  /** Compass direction the ground falls towards, degrees clockwise from north. */
  slopeAspect: number;
  /** Height of the house, metres — it is the biggest shadow on most plots. */
  houseHeightM: number;
}

export interface Design {
  version: number;
  site: SiteProfile;
  placements: Placement[];
  /** What is already there: shade, structures, things you are keeping. */
  features: SiteFeature[];
  /** Ground that behaves differently. */
  zones: SiteZone[];
  /** Per-system overrides keyed by system id — this is how a system moves
   *  from `researched` to `proven` with your own measured numbers. */
  overrides: Record<string, SystemOverride>;
  /** User-authored systems that are not in the shipped catalog. */
  customSystems: SystemDef[];
}

export interface SystemOverride {
  evidence?: EvidenceTier;
  /** Scale factor applied to every *produced* flow — the quickest way to say
   *  "the book says 4 kg/m², I get 2.6". */
  yieldFactor?: number;
  capitalPerUnit?: number;
  notes?: string;
  sources?: string[];
  /** Per-flow absolute overrides, keyed by `${direction}:${resource}`. */
  flowOverrides?: Record<string, number>;
}
