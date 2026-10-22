export const RESOURCES = {
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
    biochar: {
        id: 'biochar', label: 'Raw biochar', unit: 'kg / month',
        shortUnit: 'kg', goal: false, byproduct: false, category: 'nutrient',
    },
    labor: {
        id: 'labor', label: 'Your time', unit: 'hours / month',
        shortUnit: 'h', goal: false, byproduct: false, category: 'effort',
    },
};
export const RESOURCE_ORDER = [
    'waterPotable', 'waterIrrigation', 'electricity', 'heat',
    'foodCalories', 'foodProtein', 'compost', 'animalFeed',
    'biomass', 'biochar', 'greywater', 'blackwater', 'organicWaste', 'labor',
];
export const EVIDENCE = {
    experimental: {
        tier: 'experimental',
        label: 'Unproven',
        short: 'Unproven',
        blurb: 'Speculative, contested or highly site-dependent. Included so you can explore it, but never counted on: the low case assumes it barely works.',
        low: 0.25,
        mid: 1,
        high: 1.6,
    },
    researched: {
        tier: 'researched',
        label: 'Researched',
        short: 'Researched',
        blurb: 'Well documented somewhere else, but not yet tried in this yard. Treated as a wide estimate — real output here could be a third lower.',
        low: 0.65,
        mid: 1,
        high: 1.35,
    },
    testedFailed: {
        tier: 'testedFailed',
        label: 'Tested — did not work',
        short: 'Failed',
        blurb: 'You built it here and it failed. Counted as producing almost nothing, while still costing the money, the labour and the ground it took — because that is what happened. Kept on the plan so the attempt is on the record and nobody spends another spring on it.',
        low: 0,
        mid: 0.05,
        high: 0.15,
    },
    testedPartial: {
        tier: 'testedPartial',
        label: 'Tested — partly worked',
        short: 'Partly',
        blurb: 'You built it here and it underperformed, or only worked in some years. The central estimate drops to about two thirds of the catalog figure. If you know by how much it fell short, mark it as working and enter the measured number instead — this tier is for when you know it disappointed but not by how much.',
        low: 0.35,
        mid: 0.65,
        high: 0.9,
    },
    testedSuccess: {
        tier: 'testedSuccess',
        label: 'Tested — works',
        short: 'Works',
        blurb: 'Built and measured on this site, and it does what it should. The numbers come from your own logs, so the model treats them as near-certain.',
        low: 0.9,
        mid: 1,
        high: 1.1,
    },
};
/**
 * Least certain first, so a row of these reads left to right from "somebody
 * wrote this down somewhere" to "I watched it happen in my own garden".
 */
export const EVIDENCE_ORDER = [
    'experimental', 'researched', 'testedFailed', 'testedPartial', 'testedSuccess',
];
/**
 * Look up a tier's metadata without trusting the input.
 *
 * Tiers arrive from saved designs and imported files, so an unknown string is
 * a question of when rather than whether — a hand-edited export, or a value
 * from a future version opened by an older build. Indexing the map blind
 * returns undefined and the next property access takes the page down, so it
 * falls back to the tier that claims least.
 */
export function evidenceMeta(tier) {
    return (tier && EVIDENCE[tier]) || EVIDENCE.researched;
}
export function isEvidenceTier(v) {
    return typeof v === 'string' && v in EVIDENCE;
}
/** The tiers that mean you actually built the thing. */
export const TESTED_TIERS = ['testedFailed', 'testedPartial', 'testedSuccess'];
