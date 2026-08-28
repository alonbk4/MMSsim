import { CATALOG_BY_ID } from './catalog';
import { buildDrivers, DAYS_IN_MONTH, type DriverSeries } from './climate';
import { planFootprint } from './footprint';
import { EVIDENCE, RESOURCES, RESOURCE_ORDER } from './resources';
import { sunExposure, type ExposureReport } from './shade';
import type {
  Design, EvidenceTier, Placement, Rate, ResourceId, SeasonProfileId,
  SiteProfile, SystemDef, SystemOverride,
} from './types';

export type Scenario = 'low' | 'expected' | 'high';

export interface ResourceMonth {
  produced: number;
  /** What the design needs to run. Optional draws are excluded — a compost bay
   *  would like woody material, but going without is not a shortfall. */
  demanded: number;
  /** Opportunistic draw: taken only from what is left after the real demand. */
  demandedOptional: number;
  /** Drawn from storage this month (positive) or added to it (negative). */
  fromStorage: number;
  stockEnd: number;
  capacity: number;
  shortfall: number;
  surplus: number;
}

export interface ResourceYear {
  resource: ResourceId;
  months: ResourceMonth[];
  produced: number;
  demanded: number;
  shortfall: number;
  surplus: number;
  /** 0..1. Share of the year's demand actually met. Only meaningful for goals. */
  coverage: number;
  /** Months in which demand was not fully met. */
  shortMonths: number[];
  capacity: number;
}

export interface PlacementReport {
  placementId: string;
  systemId: string;
  name: string;
  /** 0..1 — how much of the year the system could actually run, given its
   *  inputs. Below 1 means something upstream is missing. */
  runRate: number;
  /** Inputs that limited it, worst first. */
  limitedBy: ResourceId[];
  capital: number;
  upkeepPerYear: number;
  laborHoursPerYear: number;
  footprintM2: number;
  roofM2: number;
  evidence: EvidenceTier;
  /** Share of available sunlight this plot receives across the year, 0..1. */
  sunExposure: number;
  /** What costs it the most light, when something does. */
  shadedBy?: { label: string; lost: number };
}

export interface Warning {
  level: 'error' | 'warn' | 'info';
  title: string;
  detail: string;
  placementId?: string;
  resource?: ResourceId;
}

export interface ScenarioResult {
  scenario: Scenario;
  resources: Record<ResourceId, ResourceYear>;
  placements: PlacementReport[];
}

export interface SimResult {
  expected: ScenarioResult;
  low: ScenarioResult;
  high: ScenarioResult;
  totals: {
    capital: number;
    upkeepPerYear: number;
    laborHoursPerYear: number;
    footprintM2: number;
    roofM2: number;
    lotAreaM2: number;
    roofAreaM2: number;
  };
  evidenceMix: Record<EvidenceTier, number>;
  warnings: Warning[];
  drivers: DriverSeries;
}

/* --------------------------------------------------------------------- */

const ZERO_12 = () => new Array(12).fill(0);

/** Merge a catalog system with the user's overrides for it. */
export function effectiveSystem(def: SystemDef, ov?: SystemOverride): SystemDef {
  if (!ov) return def;
  const yieldFactor = ov.yieldFactor ?? 1;
  return {
    ...def,
    evidence: ov.evidence ?? def.evidence,
    capitalPerUnit: ov.capitalPerUnit ?? def.capitalPerUnit,
    notes: ov.notes ?? def.notes,
    sources: ov.sources ?? def.sources,
    flows: def.flows.map((f) => {
      const key = `${f.direction}:${f.resource}`;
      const abs = ov.flowOverrides?.[key];
      let rate: Rate = f.rate;
      if (abs !== undefined) rate = scaleRateTo(rate, abs);
      else if (f.direction === 'produce' && yieldFactor !== 1) rate = scaleRate(rate, yieldFactor);
      return { ...f, rate };
    }),
  };
}

function scaleRate(rate: Rate, k: number): Rate {
  switch (rate.kind) {
    case 'constant': return { ...rate, perUnitPerMonth: rate.perUnitPerMonth * k };
    case 'annual': return { ...rate, perUnitPerYear: rate.perUnitPerYear * k };
    case 'driver': return { ...rate, coefficient: rate.coefficient * k };
  }
}

/** Replace a rate's magnitude with an absolute per-unit-per-year figure. */
function scaleRateTo(rate: Rate, perUnitPerYear: number): Rate {
  switch (rate.kind) {
    case 'constant': return { ...rate, perUnitPerMonth: perUnitPerYear / 12 };
    case 'annual': return { ...rate, perUnitPerYear };
    case 'driver': return { kind: 'annual', perUnitPerYear, season: 'flat' };
  }
}

export type SeasonProfiles = Record<SeasonProfileId, number[]>;

export function buildSeasonProfiles(site: SiteProfile, drivers: DriverSeries): SeasonProfiles {
  const norm = (xs: number[]): number[] => {
    const total = xs.reduce((a, b) => a + b, 0);
    return total > 0 ? xs.map((x) => x / total) : DAYS_IN_MONTH.map((d) => d / 365);
  };
  return {
    flat: DAYS_IN_MONTH.map((d) => d / 365),
    growing: drivers.growingShare,
    summer: norm(site.meanTempC.map((t, i) => Math.max(0, t - 6) * DAYS_IN_MONTH[i])),
    winter: norm(site.meanTempC.map((t, i) => Math.max(0, 16 - t) * DAYS_IN_MONTH[i])),
  };
}

/** Amount of a flow for one month, for `units` of the system, before derating. */
function rateAmount(
  rate: Rate, month: number, units: number,
  drivers: DriverSeries, seasons: SeasonProfiles,
): number {
  switch (rate.kind) {
    case 'constant':
      return rate.perUnitPerMonth * units;
    case 'annual':
      return rate.perUnitPerYear * seasons[rate.season][month] * units;
    case 'driver':
      return drivers[rate.driver][month] * rate.coefficient * units;
  }
}

/** A flow's total for one unit across a whole year, at this site. */
export function annualPerUnit(
  rate: Rate, drivers: DriverSeries, seasons: SeasonProfiles,
): number {
  let total = 0;
  for (let m = 0; m < 12; m++) total += rateAmount(rate, m, 1, drivers, seasons);
  return total;
}

/** Which resources the household itself supplies and demands each month. */
function householdFlows(site: SiteProfile, month: number) {
  const days = DAYS_IN_MONTH[month];
  const people = site.household;
  const water = people * site.waterUsePerPersonLPerDay * days;
  return {
    demand: {
      waterPotable: water * (1 - 0.35),
      // Toilet + outdoor tap draw does not need drinking-grade water.
      waterIrrigation: water * 0.35,
      electricity: people * site.electricityPerPersonKwhPerDay * days,
      // Hot water is a flat per-person load; space heating scales with how
      // far the month sits below a 18 °C balance point.
      heat: people * 1.2 * days + 1.5 * Math.max(0, 18 - site.meanTempC[month]) * days,
      foodCalories: people * site.caloriesPerPersonPerDay * days,
      foodProtein: people * site.proteinPerPersonKgPerMonth * (days / 30.4),
    } as Partial<Record<ResourceId, number>>,
    supply: {
      greywater: water * site.greywaterFraction,
      blackwater: water * 0.25,
      organicWaste: people * 6.5 * (days / 30.4),
    } as Partial<Record<ResourceId, number>>,
  };
}

const STORABLE: ResourceId[] = ['waterIrrigation', 'waterPotable', 'electricity', 'foodCalories', 'biomass', 'compost', 'animalFeed'];

interface ActiveSystem {
  placement: Placement;
  def: SystemDef;
  /** Output multiplier for the current scenario, from the evidence tier. */
  confidence: number;
  /** What the obstructions on site leave this plot, month by month. */
  exposure: ExposureReport;
}

/**
 * Output multiplier from shade for one month.
 *
 * A panel in half shade makes half the power; a bed in half shade does not make
 * half the food, because a plant answers less light with slower growth rather
 * than by switching off. `sunSensitivity` is how much of that gap each system
 * actually feels.
 */
function shadeFactor(def: SystemDef, exposure: ExposureReport, month: number): number {
  const sensitivity = def.sunSensitivity ?? 0;
  if (sensitivity <= 0) return 1;
  return 1 - sensitivity * (1 - exposure.monthly[month]);
}

function runScenario(
  design: Design,
  systems: ActiveSystem[],
  drivers: DriverSeries,
  seasons: SeasonProfiles,
  scenario: Scenario,
): ScenarioResult {
  const site = design.site;
  const resources = {} as Record<ResourceId, ResourceYear>;
  for (const r of RESOURCE_ORDER) {
    resources[r] = {
      resource: r, months: [], produced: 0, demanded: 0, shortfall: 0,
      surplus: 0, coverage: 1, shortMonths: [], capacity: 0,
    };
  }

  // Storage capacity is fixed for the year.
  const capacity: Partial<Record<ResourceId, number>> = {};
  for (const s of systems) {
    if (s.def.storage) {
      const { resource, capacityPerUnit } = s.def.storage;
      capacity[resource] = (capacity[resource] ?? 0) + capacityPerUnit * s.placement.units;
    }
  }
  for (const r of RESOURCE_ORDER) resources[r].capacity = capacity[r] ?? 0;

  // Tanks start half full, then we run 24 months and keep the last 12 so the
  // storage state is self-consistent rather than an artefact of the guess.
  const stock: Partial<Record<ResourceId, number>> = {};
  for (const r of STORABLE) stock[r] = (capacity[r] ?? 0) * 0.5;

  const runRateSum: Record<string, number> = {};
  const limitCount: Record<string, Partial<Record<ResourceId, number>>> = {};
  for (const s of systems) { runRateSum[s.placement.id] = 0; limitCount[s.placement.id] = {}; }

  for (let step = 0; step < 24; step++) {
    const month = step % 12;
    const record = step >= 12;
    const hh = householdFlows(site, month);

    // Gross flows per system, before any derating.
    const gross = systems.map((s) => {
      const produce: Partial<Record<ResourceId, number>> = {};
      const consume: Partial<Record<ResourceId, number>> = {};
      const optional: Partial<Record<ResourceId, number>> = {};
      const required: ResourceId[] = [];
      for (const f of s.def.flows) {
        const amt = rateAmount(f.rate, month, s.placement.units, drivers, seasons);
        if (f.direction === 'produce') {
          produce[f.resource] =
            (produce[f.resource] ?? 0) + amt * s.confidence * shadeFactor(s.def, s.exposure, month);
        } else if (f.optional) {
          optional[f.resource] = (optional[f.resource] ?? 0) + amt;
        } else {
          consume[f.resource] = (consume[f.resource] ?? 0) + amt;
          if (f.resource !== 'labor' && amt > 0) required.push(f.resource);
        }
      }
      return { s, produce, consume, optional, required };
    });

    // Fixed-point pass: a system that cannot get its inputs cannot produce its
    // outputs, which in turn changes what is available downstream.
    const derate = new Array(systems.length).fill(1);
    let avail: Partial<Record<ResourceId, number>> = {};
    for (let iter = 0; iter < 6; iter++) {
      const supply: Partial<Record<ResourceId, number>> = {};
      const demand: Partial<Record<ResourceId, number>> = {};
      for (const [r, v] of Object.entries(hh.supply)) supply[r as ResourceId] = v;
      for (const [r, v] of Object.entries(hh.demand)) demand[r as ResourceId] = v;
      for (const r of STORABLE) supply[r] = (supply[r] ?? 0) + (stock[r] ?? 0);
      gross.forEach((g, i) => {
        for (const [r, v] of Object.entries(g.produce)) {
          supply[r as ResourceId] = (supply[r as ResourceId] ?? 0) + v * derate[i];
        }
        for (const [r, v] of Object.entries(g.consume)) {
          demand[r as ResourceId] = (demand[r as ResourceId] ?? 0) + v * derate[i];
        }
      });
      avail = {};
      for (const r of RESOURCE_ORDER) {
        const d = demand[r] ?? 0;
        const sup = supply[r] ?? 0;
        avail[r] = d <= 0 ? 1 : Math.min(1, sup / d);
      }
      // Labour is never a hard constraint — you can always decide to work more,
      // or the system just gets less attention. It is reported, not enforced.
      avail.labor = 1;
      gross.forEach((g, i) => {
        let next = 1;
        for (const r of g.required) next = Math.min(next, avail[r] ?? 1);
        // Damped update keeps mutually-dependent loops from oscillating.
        derate[i] = derate[i] * 0.4 + next * 0.6;
      });
    }

    // Settle the month with the converged derates.
    const supply: Partial<Record<ResourceId, number>> = {};
    const demand: Partial<Record<ResourceId, number>> = {};
    const wanted: Partial<Record<ResourceId, number>> = {};
    for (const [r, v] of Object.entries(hh.supply)) supply[r as ResourceId] = v;
    for (const [r, v] of Object.entries(hh.demand)) demand[r as ResourceId] = v;
    gross.forEach((g, i) => {
      for (const [r, v] of Object.entries(g.produce)) {
        supply[r as ResourceId] = (supply[r as ResourceId] ?? 0) + v * derate[i];
      }
      for (const [r, v] of Object.entries(g.consume)) {
        demand[r as ResourceId] = (demand[r as ResourceId] ?? 0) + v * derate[i];
      }
      for (const [r, v] of Object.entries(g.optional)) {
        wanted[r as ResourceId] = (wanted[r as ResourceId] ?? 0) + v * derate[i];
      }
      if (record) {
        runRateSum[g.s.placement.id] += derate[i] / 12;
        for (const r of g.required) {
          if ((avail[r] ?? 1) < 0.995) {
            const c = limitCount[g.s.placement.id];
            c[r] = (c[r] ?? 0) + 1;
          }
        }
      }
    });

    for (const r of RESOURCE_ORDER) {
      const produced = supply[r] ?? 0;
      const demanded = demand[r] ?? 0;
      const opportunistic = wanted[r] ?? 0;
      const cap = capacity[r] ?? 0;
      const start = STORABLE.includes(r) ? (stock[r] ?? 0) : 0;
      const pool = produced + start;
      // Real demand is served first; optional draws only get what is left.
      const met = Math.min(pool, demanded);
      const leftover = Math.max(0, pool - met - Math.min(pool - met, opportunistic));
      const end = STORABLE.includes(r) ? Math.min(leftover, cap) : 0;
      const surplus = leftover - end;
      if (STORABLE.includes(r)) stock[r] = end;
      if (record) {
        const m: ResourceMonth = {
          produced,
          demanded,
          demandedOptional: opportunistic,
          fromStorage: start - end,
          stockEnd: end,
          capacity: cap,
          shortfall: Math.max(0, demanded - pool),
          surplus,
        };
        const y = resources[r];
        y.months[month] = m;
        y.produced += produced;
        y.demanded += demanded;
        y.shortfall += m.shortfall;
        y.surplus += surplus;
        if (m.shortfall > Math.max(1e-6, demanded * 0.005)) y.shortMonths.push(month);
      }
    }
  }

  for (const r of RESOURCE_ORDER) {
    const y = resources[r];
    y.coverage = y.demanded > 0 ? Math.min(1, (y.demanded - y.shortfall) / y.demanded) : 1;
  }

  const placements: PlacementReport[] = systems.map((s) => {
    const counts = limitCount[s.placement.id];
    const limitedBy = (Object.entries(counts) as [ResourceId, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([r]) => r);
    const laborFlow = s.def.flows.find((f) => f.resource === 'labor' && f.direction === 'consume');
    let labor = 0;
    if (laborFlow) {
      for (let m = 0; m < 12; m++) {
        labor += rateAmount(laborFlow.rate, m, s.placement.units, drivers, seasons);
      }
    }
    return {
      placementId: s.placement.id,
      systemId: s.def.id,
      name: s.placement.label || s.def.name,
      runRate: Math.min(1, runRateSum[s.placement.id]),
      limitedBy,
      capital: s.def.capitalPerUnit * s.placement.units,
      upkeepPerYear: s.def.upkeepCostPerUnitPerMonth * s.placement.units * 12,
      laborHoursPerYear: labor,
      footprintM2: s.def.footprintPerUnit * s.placement.units,
      roofM2: (s.def.roofFootprintPerUnit ?? 0) * s.placement.units,
      evidence: s.def.evidence,
      sunExposure: s.exposure.annual,
      ...(s.exposure.worstCaster
        ? { shadedBy: { label: s.exposure.worstCaster.label, lost: s.exposure.worstCaster.lost } }
        : {}),
    };
  });

  return { scenario, resources, placements };
}

export function simulate(
  design: Design,
  catalogById: Record<string, SystemDef>,
): SimResult {
  const drivers = buildDrivers(design.site);
  const seasons = buildSeasonProfiles(design.site, drivers);

  const active = design.placements.filter((p) => p.enabled);
  const exposure = sunExposure(design);
  const OPEN: ExposureReport = { monthly: new Array(12).fill(1), annual: 1 };
  const build = (scenario: Scenario): ActiveSystem[] =>
    active.flatMap((placement) => {
      const base = catalogById[placement.systemId]
        ?? design.customSystems.find((s) => s.id === placement.systemId);
      if (!base) return [];
      const def = effectiveSystem(base, design.overrides[placement.systemId]);
      const band = EVIDENCE[def.evidence];
      const confidence = scenario === 'low' ? band.low : scenario === 'high' ? band.high : 1;
      return [{ placement, def, confidence, exposure: exposure[placement.id] ?? OPEN }];
    });

  const expected = runScenario(design, build('expected'), drivers, seasons, 'expected');
  const low = runScenario(design, build('low'), drivers, seasons, 'low');
  const high = runScenario(design, build('high'), drivers, seasons, 'high');

  let capital = 0, upkeep = 0, labor = 0, footprint = 0, roof = 0;
  const evidenceMix: Record<EvidenceTier, number> = { proven: 0, researched: 0, experimental: 0 };
  for (const p of expected.placements) {
    capital += p.capital;
    upkeep += p.upkeepPerYear;
    labor += p.laborHoursPerYear;
    footprint += p.footprintM2;
    roof += p.roofM2;
    evidenceMix[p.evidence] += 1;
  }

  const warnings = buildWarnings(design, expected, low, { footprint, roof });

  return {
    expected, low, high,
    totals: {
      capital, upkeepPerYear: upkeep, laborHoursPerYear: labor,
      footprintM2: footprint, roofM2: roof,
      lotAreaM2: design.site.lotAreaM2, roofAreaM2: design.site.roofAreaM2,
    },
    evidenceMix,
    warnings,
    drivers,
  };
}

function buildWarnings(
  design: Design,
  expected: ScenarioResult,
  low: ScenarioResult,
  areas: { footprint: number; roof: number },
): Warning[] {
  const w: Warning[] = [];
  const site = design.site;

  if (areas.footprint > site.lotAreaM2) {
    w.push({
      level: 'error',
      title: 'Design is bigger than the yard',
      detail: `Placed systems need ${Math.round(areas.footprint)} m² but the site has ${Math.round(site.lotAreaM2)} m² of usable ground.`,
    });
  } else if (areas.footprint > site.lotAreaM2 * 0.85) {
    w.push({
      level: 'warn',
      title: 'Almost no slack left on the ground',
      detail: `${Math.round(areas.footprint)} of ${Math.round(site.lotAreaM2)} m² is committed. Leave room for access, paths and the things you have not thought of yet.`,
    });
  }
  if (areas.roof > site.roofAreaM2) {
    w.push({
      level: 'error',
      title: 'More on the roof than the roof has',
      detail: `Roof-mounted systems need ${Math.round(areas.roof)} m² against ${Math.round(site.roofAreaM2)} m² available. Catchment and PV are competing for the same surface.`,
    });
  }

  for (const r of RESOURCE_ORDER) {
    const meta = RESOURCES[r];
    if (!meta.goal) continue;
    const y = expected.resources[r];
    if (y.demanded <= 0) continue;
    if (y.coverage < 0.999) {
      const months = y.shortMonths.length;
      w.push({
        level: y.coverage < 0.5 ? 'warn' : 'info',
        resource: r,
        title: `${meta.label}: ${Math.round(y.coverage * 100)}% covered`,
        detail: months
          ? `Short in ${months} month${months === 1 ? '' : 's'} of the year. The gap is ${format(y.shortfall)} ${meta.shortUnit}.`
          : `Annual gap of ${format(y.shortfall)} ${meta.shortUnit}.`,
      });
    }
    const lowY = low.resources[r];
    if (y.coverage > 0.95 && lowY.coverage < 0.8) {
      w.push({
        level: 'warn',
        resource: r,
        title: `${meta.label} only works if the unproven parts do`,
        detail: `Covered at ${Math.round(y.coverage * 100)}% on expected figures but only ${Math.round(lowY.coverage * 100)}% if the researched and unproven systems come in at the low end of their range.`,
      });
    }
  }

  for (const p of expected.placements) {
    // Shade is reported separately from starvation: one is a siting problem you
    // fix with a saw or a different corner, the other is a missing input.
    const sensitivity = catalogSensitivity(design, p.systemId);
    if (sensitivity > 0.3 && p.sunExposure < 0.8) {
      w.push({
        level: p.sunExposure < 0.55 ? 'warn' : 'info',
        placementId: p.placementId,
        title: `${p.name} is in the shade`,
        detail: p.shadedBy
          ? `It sees ${Math.round(p.sunExposure * 100)}% of the available sun across the year, and ${p.shadedBy.label} takes the largest share. Move it, lower the obstruction, or accept the lower yield.`
          : `It sees ${Math.round(p.sunExposure * 100)}% of the available sun across the year.`,
      });
    }
    if (p.runRate < 0.9 && p.limitedBy.length) {
      const r = p.limitedBy[0];
      w.push({
        level: 'warn',
        placementId: p.placementId,
        resource: r,
        title: `${p.name} is starved of ${RESOURCES[r].label.toLowerCase()}`,
        detail: `It can only run at about ${Math.round(p.runRate * 100)}% of capacity because there is not enough ${RESOURCES[r].label.toLowerCase()} to go round.`,
      });
    }
  }

  // Ground you have marked as behaving differently. These are siting warnings,
  // not physics: the model does not silently dock yield for them, it tells you
  // and leaves the call to you.
  const ZONE_RULES: Record<string, { systems: RegExp; level: Warning['level']; why: string }> = {
    wet: {
      systems: /bed|potato|squash|root-cellar|compost|hugelkultur|coppice/,
      level: 'warn',
      why: 'roots and stored crops rot in ground that stays saturated; raise the bed or drain it first',
    },
    dry: {
      systems: /bed|potato|squash|polytunnel|greenhouse|berry|fruit/,
      level: 'warn',
      why: 'this ground dries out fastest, so it will carry the highest irrigation demand on the site',
    },
    rocky: {
      systems: /bed|potato|swale|cistern|septic|well|cellar|pond/,
      level: 'warn',
      why: 'digging here is the expensive part, and swales and trenches may not cut at all',
    },
    frostPocket: {
      systems: /fruit|berry|beehive|food-forest/,
      level: 'warn',
      why: 'cold air pools here, and a frost at blossom takes the whole year of fruit',
    },
    offLimits: {
      systems: /./,
      level: 'error',
      why: 'this ground is spoken for — septic field, easement, setback or access',
    },
  };

  for (const p of expected.placements) {
    const placement = design.placements.find((q) => q.id === p.placementId);
    if (!placement) continue;
    const def = CATALOG_BY_ID[placement.systemId]
      ?? design.customSystems.find((c) => c.id === placement.systemId);
    if (!def) continue;
    const fp = planFootprint(def, placement);
    for (const zone of design.zones) {
      if (!rectsOverlap(placement.x, placement.y, fp.w, fp.h, zone.x, zone.y, zone.w, zone.d)) {
        continue;
      }
      const rule = ZONE_RULES[zone.kind];
      if (!rule || !rule.systems.test(placement.systemId)) continue;
      w.push({
        level: rule.level,
        placementId: p.placementId,
        title: `${p.name} sits on ${zone.label || describeZone(zone.kind)}`,
        detail: `${rule.why.charAt(0).toUpperCase()}${rule.why.slice(1)}.`,
      });
    }
  }

  const water = expected.resources.waterIrrigation;
  if (water.capacity > 0 && water.months.some((m) => m.stockEnd <= water.capacity * 0.02)) {
    const empty = water.months.filter((m) => m.stockEnd <= water.capacity * 0.02).length;
    w.push({
      level: 'warn',
      resource: 'waterIrrigation',
      title: 'Water storage runs dry',
      detail: `Tanks and ponds hit empty in ${empty} month${empty === 1 ? '' : 's'}. More storage, less demand, or a bigger catchment area.`,
    });
  }

  return w;
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function describeZone(kind: string): string {
  return {
    wet: 'wet ground', dry: 'dry ground', rocky: 'rocky ground',
    frostPocket: 'a frost pocket', offLimits: 'ground that is off limits',
  }[kind] ?? 'marked ground';
}

function catalogSensitivity(design: Design, systemId: string): number {
  const def = design.customSystems.find((s) => s.id === systemId);
  if (def) return def.sunSensitivity ?? 0;
  return CATALOG_BY_ID[systemId]?.sunSensitivity ?? 0;
}

function format(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return `${Math.round(n)}`;
}

export const EMPTY_MONTH: ResourceMonth = {
  produced: 0, demanded: 0, demandedOptional: 0, fromStorage: 0, stockEnd: 0,
  capacity: 0, shortfall: 0, surplus: 0,
};

export { ZERO_12 };
