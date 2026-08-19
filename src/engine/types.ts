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
  /** Why it is in the tier it is in, and what would move it up a tier. */
  notes: string;
  /** Free-text provenance. For `proven` systems this is your own record. */
  sources: string[];
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
  /** Roof area available for catchment/PV, m². */
  roofAreaM2: number;
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
}

export interface Design {
  version: number;
  site: SiteProfile;
  placements: Placement[];
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
