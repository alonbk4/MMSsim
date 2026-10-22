import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const FEATURE_LABEL = {
    building: 'Building',
    tree: 'Tree',
    hedge: 'Hedge',
    fence: 'Fence',
    wall: 'Wall',
    paving: 'Paving',
};
export const ZONE_LABEL = {
    wet: 'Wet ground',
    dry: 'Dry ground',
    rocky: 'Rocky ground',
    frostPocket: 'Frost pocket',
    offLimits: 'Off limits',
};
export const ZONE_BLURB = {
    wet: 'Stays saturated. Roots and stored crops rot here.',
    dry: 'Drains fastest and carries the highest irrigation demand.',
    rocky: 'Hard to dig. Trenches and swales may not cut at all.',
    frostPocket: 'Cold air pools here. A frost at blossom costs the year.',
    offLimits: 'Spoken for — septic field, easement, setback or access.',
};
const ZONE_COLOR = {
    wet: '#3d7fa6',
    dry: '#c08a3e',
    rocky: '#7c7a72',
    frostPocket: '#6f7fb5',
    offLimits: '#b04a4a',
};
/** Zone washes and the hatch that keeps them legible without shouting. */
export function ZoneDefs() {
    return (_jsx("defs", { children: Object.keys(ZONE_COLOR).map((k) => (_jsxs("pattern", { id: `zone-${k}`, width: "0.9", height: "0.9", patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)", children: [_jsx("rect", { width: "0.9", height: "0.9", fill: ZONE_COLOR[k], opacity: "0.1" }), _jsx("line", { x1: "0", y1: "0", x2: "0", y2: "0.9", stroke: ZONE_COLOR[k], strokeWidth: "0.16", opacity: "0.35" })] }, k))) }));
}
export function ZoneShape({ zone, selected }) {
    return (_jsx("g", { children: _jsx("rect", { width: zone.w, height: zone.d, fill: `url(#zone-${zone.kind})`, stroke: ZONE_COLOR[zone.kind], strokeWidth: selected ? 2.2 : 1.4, strokeDasharray: "4 3", vectorEffect: "non-scaling-stroke", rx: 0.3 }) }));
}
/** An obstruction, drawn as the thing it is. */
export function FeatureShape({ feature, selected, }) {
    const ink = 'var(--text-secondary)';
    const fill = 'var(--surface-2)';
    const sw = selected ? 2.4 : 1.5;
    if (feature.kind === 'tree') {
        const r = Math.min(feature.w, feature.d) / 2;
        const leafy = feature.foliage !== 'deciduous';
        return (_jsxs("g", { children: [_jsx("circle", { cx: feature.w / 2, cy: feature.d / 2, r: r, fill: "var(--cat-fill, #9dc48c)", fillOpacity: leafy ? 0.5 : 0.32, stroke: ink, strokeWidth: sw, strokeDasharray: leafy ? undefined : '4 3', vectorEffect: "non-scaling-stroke" }), _jsx("circle", { cx: feature.w / 2, cy: feature.d / 2, r: Math.max(0.12, r * 0.09), fill: ink })] }));
    }
    if (feature.kind === 'paving') {
        return (_jsx("rect", { width: feature.w, height: feature.d, rx: 0.25, fill: fill, stroke: ink, strokeWidth: sw, strokeOpacity: "0.7", vectorEffect: "non-scaling-stroke" }));
    }
    const linear = feature.kind === 'fence' || feature.kind === 'wall' || feature.kind === 'hedge';
    return (_jsxs("g", { children: [_jsx("rect", { width: feature.w, height: feature.d, rx: feature.kind === 'hedge' ? Math.min(feature.w, feature.d) / 2 : 0.2, fill: feature.kind === 'hedge' ? 'var(--cat-fill, #9dc48c)' : fill, fillOpacity: feature.kind === 'hedge' ? 0.45 : 0.95, stroke: ink, strokeWidth: sw, vectorEffect: "non-scaling-stroke" }), feature.kind === 'building' && (_jsx("line", { x1: feature.w / 2, y1: 0, x2: feature.w / 2, y2: feature.d, stroke: ink, strokeWidth: "1", opacity: "0.6", vectorEffect: "non-scaling-stroke" })), linear && feature.kind !== 'hedge' && (
            // Posts, so a fence reads as a fence at a glance.
            _jsx("g", { stroke: ink, strokeWidth: "1.4", vectorEffect: "non-scaling-stroke", opacity: "0.75", children: (() => {
                    const posts = Math.max(2, Math.round(Math.max(feature.w, feature.d) / 2));
                    return Array.from({ length: posts }, (_, i) => {
                        const t = i / (posts - 1);
                        return feature.w >= feature.d
                            ? _jsx("line", { x1: t * feature.w, y1: -0.25, x2: t * feature.w, y2: feature.d + 0.25 }, i)
                            : _jsx("line", { x1: -0.25, y1: t * feature.d, x2: feature.w + 0.25, y2: t * feature.d }, i);
                    });
                })() }))] }));
}
/** The shadows themselves, at the moment the scrubber is set to. */
export function ShadowLayer({ shapes }) {
    if (shapes.length === 0)
        return null;
    return (_jsx("g", { pointerEvents: "none", children: shapes.map((s, i) => (_jsx("polygon", { points: s.points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '), fill: "var(--text-primary)", opacity: 0.1 + s.opacity * 0.14 }, i))) }));
}
