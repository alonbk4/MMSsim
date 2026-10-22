import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { CATALOG } from '../engine/catalog';
import { EVIDENCE, EVIDENCE_ORDER, RESOURCES } from '../engine/resources';
import { FEATURE_DEFAULTS, systemById, useApp, useSimulation } from '../state/store';
import { FEATURE_LABEL, ZONE_BLURB, ZONE_LABEL } from './plan/site';
import { CATEGORY_ICON, CATEGORY_LABEL, compact, EvidenceBadge, Field, Icon, money, pct, } from './common';
import { trimNum, YardCanvas } from './YardCanvas';
const CATEGORIES = ['water', 'food', 'energy', 'sanitation', 'soil', 'shelter'];
export function DesignPane() {
    const selected = useApp((s) => s.selectedPlacementId);
    const selectedFeature = useApp((s) => s.selectedFeatureId);
    const selectedZone = useApp((s) => s.selectedZoneId);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const anySelected = selected || selectedFeature || selectedZone;
    return (_jsxs("div", { className: "pane no-scroll", style: { display: 'flex', flexDirection: 'column', position: 'relative' }, children: [_jsx(YardCanvas, {}), !anySelected && !paletteOpen && (_jsxs("button", { className: "btn primary", style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 16, display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow)' }, onClick: () => setPaletteOpen(true), children: [_jsx(Icon, { name: "plus", size: 16 }), " Add a system"] })), paletteOpen && _jsx(PaletteSheet, { onClose: () => setPaletteOpen(false) }), selected && _jsx(Inspector, {}), selectedFeature && _jsx(FeatureInspector, {}), selectedZone && _jsx(ZoneInspector, {})] }));
}
function PaletteSheet({ onClose }) {
    const design = useApp((s) => s.design);
    const addPlacement = useApp((s) => s.addPlacement);
    const addFeature = useApp((s) => s.addFeature);
    const addZone = useApp((s) => s.addZone);
    const [tab, setTab] = useState('systems');
    const [category, setCategory] = useState('all');
    const [tiers, setTiers] = useState(new Set(EVIDENCE_ORDER));
    const systems = useMemo(() => {
        const all = [...CATALOG, ...design.customSystems]
            .map((s) => systemById(design, s.id))
            .filter(Boolean);
        return all
            .filter((s) => category === 'all' || s.category === category)
            .filter((s) => tiers.has(s.evidence))
            .sort((a, b) => EVIDENCE_ORDER.indexOf(a.evidence) - EVIDENCE_ORDER.indexOf(b.evidence)
            || a.name.localeCompare(b.name));
    }, [design, category, tiers]);
    const toggleTier = (t) => {
        const next = new Set(tiers);
        if (next.has(t) && next.size > 1)
            next.delete(t);
        else
            next.add(t);
        setTiers(next);
    };
    return (_jsxs("div", { className: "sheet", children: [_jsx("div", { className: "grabber" }), _jsxs("header", { children: [_jsx("h2", { children: "Add to the yard" }), _jsx("span", { className: "grow" }), _jsx("button", { className: "btn small", onClick: onClose, "aria-label": "Close", children: _jsx(Icon, { name: "close", size: 14 }) })] }), _jsxs("div", { className: "sheet-body stack", children: [_jsxs("div", { className: "row wrap", children: [_jsx("button", { className: "chip", "aria-pressed": tab === 'systems', onClick: () => setTab('systems'), children: "Systems" }), _jsx("button", { className: "chip", "aria-pressed": tab === 'onSite', onClick: () => setTab('onSite'), children: "Already there" }), _jsx("button", { className: "chip", "aria-pressed": tab === 'ground', onClick: () => setTab('ground'), children: "Ground" })] }), tab === 'onSite' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "card-note", children: "Whatever is already on the site and in the way of your sun \u2014 your own shed, the neighbour's wall, the tree you are keeping. They produce nothing, but they cast real shadows, and the results change once they are on the plan." }), Object.keys(FEATURE_LABEL).map((kind) => (_jsxs("button", { className: "sys-row", onClick: () => { addFeature(kind); onClose(); }, children: [_jsx("span", { className: "icon", children: _jsx(Icon, { name: "shelter", size: 17 }) }), _jsxs("span", { className: "grow", children: [_jsx("span", { className: "name", children: FEATURE_LABEL[kind] }), _jsxs("span", { className: "meta-line", children: [FEATURE_DEFAULTS[kind].w, " \u00D7 ", FEATURE_DEFAULTS[kind].d, " m \u00B7", ' ', FEATURE_DEFAULTS[kind].heightM > 0
                                                        ? `${FEATURE_DEFAULTS[kind].heightM} m tall`
                                                        : 'no height'] })] })] }, kind)))] })), tab === 'ground' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "card-note", children: "Mark ground that behaves differently. These raise warnings on bad placements rather than silently docking your yield \u2014 the model tells you and leaves the call to you." }), Object.keys(ZONE_LABEL).map((kind) => (_jsxs("button", { className: "sys-row", onClick: () => { addZone(kind); onClose(); }, children: [_jsx("span", { className: "icon", children: _jsx(Icon, { name: "soil", size: 17 }) }), _jsxs("span", { className: "grow", children: [_jsx("span", { className: "name", children: ZONE_LABEL[kind] }), _jsx("span", { className: "desc", children: ZONE_BLURB[kind] })] })] }, kind)))] })), tab === 'systems' && _jsxs(_Fragment, { children: [_jsxs("div", { className: "row wrap", children: [_jsx("button", { className: "chip", "aria-pressed": category === 'all', onClick: () => setCategory('all'), children: "All" }), CATEGORIES.map((c) => (_jsx("button", { className: "chip", "aria-pressed": category === c, onClick: () => setCategory(c), children: CATEGORY_LABEL[c] }, c)))] }), _jsx("div", { className: "row wrap", children: EVIDENCE_ORDER.map((t) => (_jsx("button", { className: "chip", "aria-pressed": tiers.has(t), onClick: () => toggleTier(t), children: EVIDENCE[t].label }, t))) }), systems.map((s) => (_jsxs("button", { className: "sys-row", onClick: () => { addPlacement(s.id); onClose(); }, children: [_jsx("span", { className: "icon", children: _jsx(Icon, { name: CATEGORY_ICON[s.category], size: 17 }) }), _jsxs("span", { className: "grow", children: [_jsxs("span", { className: "row", style: { gap: 6 }, children: [_jsx("span", { className: "name grow", children: s.name }), _jsx(EvidenceBadge, { tier: s.evidence })] }), _jsx("span", { className: "desc", children: s.summary }), _jsxs("span", { className: "meta-line", children: [trimNum(s.unitDefault), " ", s.unitLabel, " \u00B7 ", money(s.capitalPerUnit * s.unitDefault), " to build"] })] })] }, s.id))), systems.length === 0 && _jsx("p", { className: "card-note", children: "Nothing matches those filters." })] })] })] }));
}
/* ------------------------------ site features ------------------------------ */
function FeatureInspector() {
    const design = useApp((s) => s.design);
    const id = useApp((s) => s.selectedFeatureId);
    const update = useApp((s) => s.updateFeature);
    const remove = useApp((s) => s.removeFeature);
    const selectFeature = useApp((s) => s.selectFeature);
    const setShadows = useApp((s) => s.setShadows);
    const sim = useSimulation();
    const f = design.features.find((x) => x.id === id);
    if (!f)
        return null;
    // Who is standing in this thing's shadow?
    const victims = sim.expected.placements
        .filter((p) => p.shadedBy?.label === (f.label || f.kind))
        .sort((a, b) => a.sunExposure - b.sunExposure);
    return (_jsxs("div", { className: "sheet", children: [_jsx("div", { className: "grabber" }), _jsxs("header", { children: [_jsx("h2", { children: f.label || FEATURE_LABEL[f.kind] }), _jsx("span", { className: "grow" }), _jsx("button", { className: "btn small", onClick: () => selectFeature(null), "aria-label": "Close", children: _jsx(Icon, { name: "close", size: 14 }) })] }), _jsxs("div", { className: "sheet-body stack", children: [_jsxs("div", { className: "row wrap", style: { gap: 6 }, children: [_jsx("span", { className: "chip", children: FEATURE_LABEL[f.kind] }), _jsx("span", { className: "chip", children: "Already on site" })] }), _jsx(Field, { label: "Name", children: _jsx("input", { type: "text", value: f.label ?? '', placeholder: FEATURE_LABEL[f.kind], onChange: (e) => update(id, { label: e.target.value }) }) }), _jsxs(Field, { label: "Height", value: `${trimNum(f.heightM)} m`, children: [_jsx("input", { type: "range", min: 0, max: 25, step: 0.25, value: f.heightM, onChange: (e) => update(id, { heightM: Number(e.target.value) }) }), _jsx("span", { className: "meta-line", children: "Height is the whole story for shade \u2014 a shadow is this, divided by the tangent of the sun's angle." })] }), _jsxs("div", { className: "row", style: { gap: 10 }, children: [_jsx(Field, { label: "Width", value: `${trimNum(f.w)} m`, children: _jsx("input", { type: "range", min: 0.2, max: 40, step: 0.2, value: f.w, onChange: (e) => update(id, { w: Number(e.target.value) }) }) }), _jsx(Field, { label: "Depth", value: `${trimNum(f.d)} m`, children: _jsx("input", { type: "range", min: 0.2, max: 40, step: 0.2, value: f.d, onChange: (e) => update(id, { d: Number(e.target.value) }) }) })] }), _jsxs(Field, { label: "What it is made of", children: [_jsxs("select", { value: f.foliage, onChange: (e) => update(id, { foliage: e.target.value }), children: [_jsx("option", { value: "solid", children: "Solid \u2014 stops nearly all light" }), _jsx("option", { value: "evergreen", children: "Evergreen \u2014 dense all year" }), _jsx("option", { value: "deciduous", children: "Deciduous \u2014 bare in winter, so far less shade" })] }), _jsx("span", { className: "meta-line", children: f.foliage === 'deciduous'
                                    ? 'Modelled as stopping about a third as much light once the leaves are down.'
                                    : f.foliage === 'evergreen'
                                        ? 'Dense year-round, which is what makes conifers such expensive neighbours.'
                                        : 'A wall is a wall in January.' })] }), _jsxs("label", { className: "row", style: { gap: 8, fontSize: 13 }, children: [_jsx("input", { type: "checkbox", checked: f.occupiesGround, style: { width: 'auto' }, onChange: (e) => update(id, { occupiesGround: e.target.checked }) }), "Takes up usable yard area"] }), victims.length > 0 && (_jsxs("div", { className: "card", style: { padding: 12 }, children: [_jsx("header", { children: _jsx("h3", { children: "What this shades" }) }), _jsx("table", { className: "data", children: _jsx("tbody", { children: victims.map((v) => (_jsxs("tr", { children: [_jsx("td", { children: v.name }), _jsxs("td", { children: [pct(v.sunExposure), " of full sun"] })] }, v.placementId))) }) })] })), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn", onClick: () => setShadows({ on: true }), children: "Show its shadow" }), _jsx("span", { className: "grow" }), _jsx("button", { className: "btn danger", onClick: () => remove(id), "aria-label": "Remove", children: _jsx(Icon, { name: "trash", size: 14 }) })] })] })] }));
}
function ZoneInspector() {
    const design = useApp((s) => s.design);
    const id = useApp((s) => s.selectedZoneId);
    const update = useApp((s) => s.updateZone);
    const remove = useApp((s) => s.removeZone);
    const selectZone = useApp((s) => s.selectZone);
    const z = design.zones.find((x) => x.id === id);
    if (!z)
        return null;
    return (_jsxs("div", { className: "sheet", children: [_jsx("div", { className: "grabber" }), _jsxs("header", { children: [_jsx("h2", { children: z.label || ZONE_LABEL[z.kind] }), _jsx("span", { className: "grow" }), _jsx("button", { className: "btn small", onClick: () => selectZone(null), "aria-label": "Close", children: _jsx(Icon, { name: "close", size: 14 }) })] }), _jsxs("div", { className: "sheet-body stack", children: [_jsx("p", { className: "card-note", children: ZONE_BLURB[z.kind] }), _jsx(Field, { label: "What this ground is", children: _jsx("select", { value: z.kind, onChange: (e) => update(id, { kind: e.target.value }), children: Object.keys(ZONE_LABEL).map((k) => (_jsx("option", { value: k, children: ZONE_LABEL[k] }, k))) }) }), _jsx(Field, { label: "Name", children: _jsx("input", { type: "text", value: z.label ?? '', placeholder: ZONE_LABEL[z.kind], onChange: (e) => update(id, { label: e.target.value }) }) }), _jsxs("div", { className: "row", style: { gap: 10 }, children: [_jsx(Field, { label: "Width", value: `${trimNum(z.w)} m`, children: _jsx("input", { type: "range", min: 0.5, max: 60, step: 0.5, value: z.w, onChange: (e) => update(id, { w: Number(e.target.value) }) }) }), _jsx(Field, { label: "Depth", value: `${trimNum(z.d)} m`, children: _jsx("input", { type: "range", min: 0.5, max: 60, step: 0.5, value: z.d, onChange: (e) => update(id, { d: Number(e.target.value) }) }) })] }), _jsxs("p", { className: "meta-line", children: ["Covers ", Math.round(z.w * z.d), " m\u00B2. Anything placed on it gets flagged in Results; nothing is docked automatically."] }), _jsxs("div", { className: "row", children: [_jsx("span", { className: "grow" }), _jsx("button", { className: "btn danger", onClick: () => remove(id), "aria-label": "Remove", children: _jsx(Icon, { name: "trash", size: 14 }) })] })] })] }));
}
/* ------------------------------ inspector ------------------------------ */
function Inspector() {
    const design = useApp((s) => s.design);
    const id = useApp((s) => s.selectedPlacementId);
    const update = useApp((s) => s.updatePlacement);
    const remove = useApp((s) => s.removePlacement);
    const select = useApp((s) => s.select);
    const inspect = useApp((s) => s.inspect);
    const setTab = useApp((s) => s.setTab);
    const sim = useSimulation();
    const placement = design.placements.find((p) => p.id === id);
    const def = placement ? systemById(design, placement.systemId) : undefined;
    if (!placement || !def)
        return null;
    const report = sim.expected.placements.find((p) => p.placementId === id);
    const ground = def.footprintPerUnit * placement.units;
    const roof = (def.roofFootprintPerUnit ?? 0) * placement.units;
    const yearly = def.flows.map((f) => {
        let total = 0;
        for (let m = 0; m < 12; m++) {
            const r = f.rate;
            total += r.kind === 'constant' ? r.perUnitPerMonth * placement.units
                : r.kind === 'annual' ? (r.perUnitPerYear * placement.units) / 12
                    : sim.drivers[r.driver][m] * r.coefficient * placement.units;
        }
        return { flow: f, total };
    });
    return (_jsxs("div", { className: "sheet", children: [_jsx("div", { className: "grabber" }), _jsxs("header", { children: [_jsx("h2", { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: placement.label || def.name }), _jsx("span", { className: "grow" }), _jsx("button", { className: "btn small", onClick: () => select(null), "aria-label": "Close", children: _jsx(Icon, { name: "close", size: 14 }) })] }), _jsxs("div", { className: "sheet-body stack", children: [_jsxs("div", { className: "row wrap", style: { gap: 6 }, children: [_jsx(EvidenceBadge, { tier: def.evidence }), _jsx("span", { className: "chip", children: CATEGORY_LABEL[def.category] }), !placement.enabled && _jsx("span", { className: "chip", children: "Turned off" })] }), _jsx("p", { className: "card-note", children: def.summary }), _jsx(Field, { label: "Size", value: `${trimNum(placement.units)} ${def.unitLabel}`, children: _jsx("input", { type: "range", min: def.unitMin, max: def.unitMax, step: def.unitStep, value: placement.units, onChange: (e) => update(id, { units: Number(e.target.value) }) }) }), _jsx(Field, { label: "Label", children: _jsx("input", { type: "text", placeholder: def.name, value: placement.label ?? '', onChange: (e) => update(id, { label: e.target.value }) }) }), _jsxs("div", { className: "tiles", children: [_jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: "Build cost" }), _jsx("div", { className: "figure", children: money(def.capitalPerUnit * placement.units) }), _jsxs("div", { className: "range", children: [money(def.upkeepCostPerUnitPerMonth * placement.units * 12), "/yr upkeep"] })] }), _jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: "Your time" }), _jsxs("div", { className: "figure", children: [compact(report?.laborHoursPerYear ?? 0), _jsx("span", { style: { fontSize: 14 }, children: " h/yr" })] }), _jsxs("div", { className: "range", children: [compact((report?.laborHoursPerYear ?? 0) / 52), " h per week"] })] }), _jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: "Sun it gets" }), _jsx("div", { className: "figure", children: pct(report?.sunExposure ?? 1) }), _jsx("div", { className: "range", children: report?.shadedBy
                                            ? `mostly ${report.shadedBy.label}`
                                            : (report?.sunExposure ?? 1) > 0.995 ? 'open sky' : 'lightly shaded' })] }), _jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: roof > 0 ? 'Roof area' : 'Ground area' }), _jsxs("div", { className: "figure", children: [compact(roof > 0 ? roof : ground), _jsx("span", { style: { fontSize: 14 }, children: " m\u00B2" })] }), _jsxs("div", { className: "range", children: [pct((roof > 0 ? roof / Math.max(1, design.site.roofAreaM2) : ground / Math.max(1, design.site.lotAreaM2))), " of what you have"] })] })] }), report && report.runRate < 0.995 && (_jsxs("div", { className: "warn-item warn", children: [_jsx("span", { className: "glyph", children: _jsx(Icon, { name: "alert", size: 16 }) }), _jsxs("span", { className: "body", children: [_jsxs("span", { className: "title", children: ["Running at ", pct(report.runRate)] }), _jsx("span", { className: "detail", children: report.limitedBy.length
                                            ? `Short of ${report.limitedBy.map((r) => RESOURCES[r].label.toLowerCase()).join(' and ')}. Add a source, or make this one smaller.`
                                            : 'Something upstream is limiting it.' })] })] })), _jsxs("div", { className: "card", style: { padding: 12 }, children: [_jsx("header", { children: _jsx("h3", { children: "What it moves, per year" }) }), _jsx("table", { className: "data", children: _jsx("tbody", { children: yearly.map(({ flow, total }, i) => (_jsxs("tr", { children: [_jsxs("td", { children: [flow.direction === 'produce' ? '↑' : '↓', " ", RESOURCES[flow.resource].label, flow.optional && _jsx("span", { className: "meta-line", children: " (if available)" })] }), _jsxs("td", { style: { color: flow.direction === 'produce' ? 'var(--success-text)' : 'var(--text-secondary)' }, children: [flow.direction === 'produce' ? '+' : '−', compact(total), " ", RESOURCES[flow.resource].shortUnit] })] }, i))) }) })] }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn", onClick: () => update(id, { enabled: !placement.enabled }), children: placement.enabled ? 'Turn off' : 'Turn on' }), _jsx("button", { className: "btn", onClick: () => { inspect(def.id); setTab('catalog'); }, children: "Evidence & sources" }), _jsx("span", { className: "grow" }), _jsx("button", { className: "btn danger", onClick: () => remove(id), "aria-label": "Remove", children: _jsx(Icon, { name: "trash", size: 14 }) })] })] })] }));
}
