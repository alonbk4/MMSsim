import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { CATALOG, CATALOG_BY_ID } from '../engine/catalog';
import { buildDrivers } from '../engine/climate';
import { EVIDENCE, EVIDENCE_ORDER, evidenceMeta, RESOURCES } from '../engine/resources';
import { annualPerUnit, buildSeasonProfiles } from '../engine/simulate';
import { systemById, useApp } from '../state/store';
import { CATEGORY_ICON, CATEGORY_LABEL, compact, EvidenceBadge, Field, Icon, lower, money, } from './common';
import { trimNum } from './YardCanvas';
const CATEGORIES = ['water', 'food', 'energy', 'sanitation', 'soil', 'shelter'];
export function CatalogPane() {
    const design = useApp((s) => s.design);
    const inspected = useApp((s) => s.inspectedSystemId);
    const inspect = useApp((s) => s.inspect);
    const [category, setCategory] = useState('all');
    const [query, setQuery] = useState('');
    const systems = useMemo(() => {
        const q = query.trim().toLowerCase();
        return [...CATALOG, ...design.customSystems]
            .map((s) => systemById(design, s.id))
            .filter((s) => category === 'all' || s.category === category)
            .filter((s) => !q || s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [design, category, query]);
    if (inspected) {
        const def = systemById(design, inspected);
        if (def)
            return _jsx(SystemDetail, { def: def, onBack: () => inspect(null) });
    }
    const counts = EVIDENCE_ORDER.map((t) => ({
        tier: t,
        n: [...CATALOG, ...design.customSystems]
            .map((s) => systemById(design, s.id))
            .filter((s) => s.evidence === t).length,
    }));
    return (_jsx("div", { className: "pane", children: _jsxs("div", { className: "pane-inner", children: [_jsxs("div", { className: "card", children: [_jsx("header", { children: _jsx("h2", { children: "The catalog" }) }), _jsx("p", { className: "card-note", children: "Every system the simulator knows about, and how much anyone actually knows about it. Open one to read what its numbers rest on \u2014 and to replace them with yours once you have built it here." }), _jsx("div", { className: "row wrap", style: { marginTop: 8 }, children: counts.map(({ tier, n }) => (_jsxs("span", { className: "row", style: { gap: 5 }, children: [_jsx(EvidenceBadge, { tier: tier }), _jsx("span", { className: "meta-line", children: n })] }, tier))) })] }), _jsx("input", { type: "text", placeholder: "Search systems\u2026", value: query, onChange: (e) => setQuery(e.target.value) }), _jsxs("div", { className: "row wrap", children: [_jsx("button", { className: "chip", "aria-pressed": category === 'all', onClick: () => setCategory('all'), children: "All" }), CATEGORIES.map((c) => (_jsx("button", { className: "chip", "aria-pressed": category === c, onClick: () => setCategory(c), children: CATEGORY_LABEL[c] }, c)))] }), _jsx("div", { className: "stack", children: systems.map((s) => (_jsxs("button", { className: "sys-row", onClick: () => inspect(s.id), children: [_jsx("span", { className: "icon", children: _jsx(Icon, { name: CATEGORY_ICON[s.category], size: 17 }) }), _jsxs("span", { className: "grow", children: [_jsxs("span", { className: "row", style: { gap: 6 }, children: [_jsx("span", { className: "name grow", children: s.name }), _jsx(EvidenceBadge, { tier: s.evidence })] }), _jsx("span", { className: "desc", children: s.summary })] })] }, s.id))) })] }) }));
}
function SystemDetail({ def, onBack }) {
    const design = useApp((s) => s.design);
    const setOverride = useApp((s) => s.setOverride);
    const addPlacement = useApp((s) => s.addPlacement);
    const setTab = useApp((s) => s.setTab);
    const inspect = useApp((s) => s.inspect);
    const override = design.overrides[def.id];
    const base = CATALOG_BY_ID[def.id] ?? def;
    const drivers = buildDrivers(design.site);
    const seasons = buildSeasonProfiles(design.site, drivers);
    const [editing, setEditing] = useState(false);
    return (_jsx("div", { className: "pane", children: _jsxs("div", { className: "pane-inner", children: [_jsxs("div", { className: "row", children: [_jsx("button", { className: "btn small", onClick: onBack, children: "\u2190 All systems" }), _jsx("span", { className: "grow" }), _jsx(EvidenceBadge, { tier: def.evidence })] }), _jsxs("div", { className: "card", children: [_jsxs("header", { children: [_jsx("span", { className: "icon", style: {
                                        width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center',
                                        background: 'var(--accent-soft)', color: 'var(--accent-ink)',
                                    }, children: _jsx(Icon, { name: CATEGORY_ICON[def.category], size: 18 }) }), _jsx("h2", { children: def.name })] }), _jsx("p", { className: "card-note", children: def.summary }), _jsxs("div", { className: "meta-line", style: { marginTop: 6 }, children: ["Sized in ", def.unitLabel, " \u00B7 ", money(def.capitalPerUnit), " per unit \u00B7", ' ', def.footprintPerUnit > 0
                                    ? `${trimNum(def.footprintPerUnit)} m² of ground per unit`
                                    : def.roofFootprintPerUnit
                                        ? `${trimNum(def.roofFootprintPerUnit)} m² of roof per unit`
                                        : 'no footprint'] }), _jsx("div", { className: "row", style: { marginTop: 10 }, children: _jsx("button", { className: "btn primary", onClick: () => { addPlacement(def.id); inspect(null); setTab('design'); }, children: "Add to the yard" }) })] }), _jsxs("div", { className: "card", children: [_jsxs("header", { children: [_jsx("h2", { children: "What it moves" }), _jsx("span", { className: "sub", children: "per unit, per year, at this site" })] }), _jsx("table", { className: "data", children: _jsxs("tbody", { children: [def.flows.map((f, i) => (_jsxs("tr", { children: [_jsxs("td", { children: [f.direction === 'produce' ? '↑ Gives' : '↓ Takes', " ", lower(RESOURCES[f.resource].label), f.optional && _jsx("span", { className: "meta-line", children: " (only if spare)" })] }), _jsxs("td", { style: { color: f.direction === 'produce' ? 'var(--success-text)' : 'var(--text-secondary)' }, children: [f.direction === 'produce' ? '+' : '−', compact(annualPerUnit(f.rate, drivers, seasons)), ' ', RESOURCES[f.resource].shortUnit] })] }, i))), def.storage && (_jsxs("tr", { children: [_jsxs("td", { children: ["\u25A3 Stores ", lower(RESOURCES[def.storage.resource].label)] }), _jsxs("td", { children: [compact(def.storage.capacityPerUnit), " ", RESOURCES[def.storage.resource].shortUnit] })] }))] }) }), _jsxs("p", { className: "meta-line", style: { marginTop: 8 }, children: ["Climate-driven figures change with the Site tab \u2014 this is what one unit does in ", design.site.name || 'your climate', ", not a universal constant."] })] }), _jsxs("div", { className: "card", children: [_jsx("header", { children: _jsx("h2", { children: "Why it sits in this tier" }) }), _jsx("p", { className: "card-note", children: def.notes }), _jsx("p", { className: "meta-line", style: { marginTop: 6 }, children: evidenceMeta(def.evidence).blurb }), _jsx("h3", { style: { marginTop: 12, marginBottom: 4 }, children: "Where the numbers come from" }), _jsx("ul", { style: { margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13 }, children: def.sources.map((s, i) => _jsx("li", { children: s }, i)) })] }), _jsxs("div", { className: "card", children: [_jsxs("header", { children: [_jsx("h2", { children: "Your numbers" }), _jsx("span", { className: "sub", children: override ? 'edited' : 'untouched' })] }), def.evidence === 'testedSuccess' ? (_jsxs("p", { className: "card-note", children: ["This one runs on your numbers. Its band is \u00B110% instead of the \u00B1", Math.round((1 - evidenceMeta(base.evidence).low) * 100), "% the catalog default carries \u2014 keep it honest by updating the figures as the seasons come in."] })) : (_jsx("p", { className: "card-note", children: "Once you have actually tried this here, say what happened. Every result in the app stops leaning on someone else's yard \u2014 including, and especially, when the answer is that it did not work." })), _jsx("div", { className: "row wrap", style: { marginTop: 8 }, children: EVIDENCE_ORDER.map((t) => (_jsx("button", { className: `chip evidence-pick ${t}`, "aria-pressed": def.evidence === t, title: EVIDENCE[t].blurb, onClick: () => setOverride(def.id, { evidence: t }), children: EVIDENCE[t].label }, t))) }), _jsx("p", { className: "meta-line", style: { marginTop: 6 }, children: evidenceMeta(def.evidence).blurb }), !editing && (_jsx("button", { className: "btn small", style: { marginTop: 10 }, onClick: () => setEditing(true), children: "Enter measured numbers" })), editing && (_jsxs("div", { className: "stack", style: { marginTop: 12 }, children: [_jsxs(Field, { label: "Output vs the catalog figure", value: `${Math.round((override?.yieldFactor ?? 1) * 100)}%`, children: [_jsx("input", { type: "range", min: 0.1, max: 2, step: 0.05, value: override?.yieldFactor ?? 1, onChange: (e) => setOverride(def.id, { yieldFactor: Number(e.target.value) }) }), _jsx("span", { className: "meta-line", children: "The quickest correction: the book says one thing, your yard says another." })] }), _jsx(Field, { label: `Build cost per ${def.unitLabel}`, children: _jsx("input", { type: "number", value: override?.capitalPerUnit ?? def.capitalPerUnit, onChange: (e) => setOverride(def.id, { capitalPerUnit: Number(e.target.value) }) }) }), _jsxs("div", { children: [_jsxs("label", { style: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 550 }, children: ["Measured yearly figures, per ", def.unitLabel] }), _jsx("div", { className: "stack", style: { marginTop: 6 }, children: def.flows.filter((f) => f.resource !== 'labor').map((f) => {
                                                const key = `${f.direction}:${f.resource}`;
                                                const current = override?.flowOverrides?.[key]
                                                    ?? annualPerUnit((CATALOG_BY_ID[def.id] ?? def).flows
                                                        .find((g) => `${g.direction}:${g.resource}` === key).rate, drivers, seasons);
                                                return (_jsx(Field, { label: `${f.direction === 'produce' ? 'Gives' : 'Takes'} ${RESOURCES[f.resource].label} (${RESOURCES[f.resource].shortUnit}/yr)`, children: _jsx("input", { type: "number", value: Number(current.toFixed(3)), onChange: (e) => setOverride(def.id, {
                                                            flowOverrides: {
                                                                ...override?.flowOverrides,
                                                                [key]: Number(e.target.value),
                                                            },
                                                        }) }) }, key));
                                            }) })] }), _jsx(Field, { label: "Your notes on this system", children: _jsx("textarea", { rows: 4, placeholder: "What you built, when, what actually happened.", value: override?.notes ?? '', onChange: (e) => setOverride(def.id, { notes: e.target.value }) }) }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn small", onClick: () => setEditing(false), children: "Done" }), _jsx("span", { className: "grow" }), override && (_jsx("button", { className: "btn small danger", onClick: () => { setOverride(def.id, null); setEditing(false); }, children: "Reset to catalog" }))] })] })), override && !editing && (_jsxs("div", { className: "meta-line", style: { marginTop: 8 }, children: ["Overridden: ", [
                                    override.evidence && `tier → ${evidenceMeta(override.evidence).label}`,
                                    override.yieldFactor && override.yieldFactor !== 1 && `output → ${Math.round(override.yieldFactor * 100)}%`,
                                    override.capitalPerUnit !== undefined && override.capitalPerUnit !== base.capitalPerUnit && 'build cost',
                                    override.flowOverrides && Object.keys(override.flowOverrides).length && `${Object.keys(override.flowOverrides).length} measured flows`,
                                    override.notes && 'notes',
                                ].filter(Boolean).join(' · ') || 'no changes'] }))] })] }) }));
}
