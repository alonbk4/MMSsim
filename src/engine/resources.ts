import type { EvidenceMeta, EvidenceTier, ResourceId, ResourceMeta } from './types';

export const RESOURCES: Record<ResourceId, ResourceMeta> = {
  waterPotable: {
    id: 'waterPotable', label: 'Drinking-grade water', unit: 'litres / month',
    shortUnit: 'L', goal: true, byproduct: false, category: 'water',
  },
  waterIrrigation: {
    id: 'waterIrrigation', label: 'Irrigation water', unit: 'litres / month',
    shortUnit: 'L', goal: true, byproduct: false, category: 'water',
  },
  greywater: {
    id: 'greywater', label: 'Greywater', unit: 'litres / month',
    shortUnit: 'L', goal: false, byproduct: true, category: 'water',
  },
  blackwater: {
    id: 'blackwater', label: 'Blackwater / humanure', unit: 'litres / month',
    shortUnit: 'L', goal: false, byproduct: true, category: 'water',
  },
  electricity: {
    id: 'electricity', label: 'Electricity', unit: 'kWh / month',
    shortUnit: 'kWh', goal: true, byproduct: false, category: 'energy',
  },
  heat: {
    id: 'heat', label: 'Heat & hot water', unit: 'kWh thermal / month',
    shortUnit: 'kWht', goal: true, byproduct: false, category: 'energy',
  },
  foodCalories: {
    id: 'foodCalories', label: 'Food energy', unit: 'kcal / month',
    shortUnit: 'kcal', goal: true, byproduct: false, category: 'food',
  },
  foodProtein: {
    id: 'foodProtein', label: 'Protein', unit: 'kg / month',
    shortUnit: 'kg', goal: true, byproduct: false, category: 'food',
  },
  compost: {
    id: 'compost', label: 'Finished compost', unit: 'kg / month',
    shortUnit: 'kg', goal: true, byproduct: false, category: 'nutrient',
  },
  organicWaste: {
    id: 'organicWaste', label: 'Organic waste', unit: 'kg / month',
    shortUnit: 'kg', goal: false, byproduct: true, category: 'nutrient',
  },
  animalFeed: {
    id: 'animalFeed', label: 'Animal feed', unit: 'kg / month',
    shortUnit: 'kg', goal: true, byproduct: false, category: 'food',
  },
  biomass: {
    id: 'biomass', label: 'Woody biomass / fuel', unit: 'kg dry / month',
    shortUnit: 'kg', goal: true, byproduct: false, category: 'energy',
  },
  labor: {
    id: 'labor', label: 'Your time', unit: 'hours / month',
    shortUnit: 'h', goal: false, byproduct: false, category: 'effort',
  },
};

export const RESOURCE_ORDER: ResourceId[] = [
  'waterPotable', 'waterIrrigation', 'electricity', 'heat',
  'foodCalories', 'foodProtein', 'compost', 'animalFeed',
  'biomass', 'greywater', 'blackwater', 'organicWaste', 'labor',
];

export const EVIDENCE: Record<EvidenceTier, EvidenceMeta> = {
  proven: {
    tier: 'proven',
    label: 'Proven here',
    blurb:
      'Built and measured on this site. The numbers come from your own logs, so the model treats them as near-certain.',
    low: 0.9,
    high: 1.1,
  },
  researched: {
    tier: 'researched',
    label: 'Researched',
    blurb:
      'Well documented somewhere else, but not yet verified in this yard. Treated as a wide estimate — real output here could be a third lower.',
    low: 0.65,
    high: 1.35,
  },
  experimental: {
    tier: 'experimental',
    label: 'Unproven',
    blurb:
      'Speculative, contested or highly site-dependent. Included so you can explore it, but never counted on: the low case assumes it barely works.',
    low: 0.25,
    high: 1.6,
  },
};

export const EVIDENCE_ORDER: EvidenceTier[] = ['proven', 'researched', 'experimental'];
