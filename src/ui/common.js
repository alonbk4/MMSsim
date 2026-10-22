import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { evidenceMeta } from '../engine/resources';
/* ------------------------------ numbers ------------------------------ */
export function compact(n) {
    const abs = Math.abs(n);
    if (abs >= 1e9)
        return `${(n / 1e9).toFixed(1)}B`;
    if (abs >= 1e6)
        return `${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
    if (abs >= 1e4)
        return `${Math.round(n / 1e3)}k`;
    if (abs >= 1e3)
        return `${(n / 1e3).toFixed(1)}k`;
    if (abs >= 100)
        return `${Math.round(n)}`;
    if (abs >= 10)
        return n.toFixed(abs % 1 === 0 ? 0 : 1);
    if (abs === 0)
        return '0';
    return n.toFixed(abs < 1 ? 2 : 1);
}
export function money(n) {
    return `$${compact(Math.round(n))}`;
}
/** "Your time" → "your time" for use mid-sentence. Leaves acronyms alone. */
export function lower(label) {
    return /^[A-Z]{2,}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}
export function pct(n) {
    return `${Math.round(n * 100)}%`;
}
/* ------------------------------ badges ------------------------------ */
export function EvidenceBadge({ tier, title }) {
    const meta = evidenceMeta(tier);
    return (_jsxs("span", { className: `evidence ${meta.tier}`, title: title ?? meta.blurb, children: [_jsx("span", { className: "dot", "aria-hidden": "true" }), meta.label] }));
}
/* ------------------------------ icons ------------------------------ */
const paths = {
    site: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 20h18" }), _jsx("path", { d: "M5 20V9l7-5 7 5v11" }), _jsx("path", { d: "M10 20v-5h4v5" })] }),
    design: _jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("path", { d: "M3 9h18M9 3v18" })] }),
    results: _jsx(_Fragment, { children: _jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" }) }),
    catalog: _jsxs(_Fragment, { children: [_jsx("path", { d: "M4 5h16M4 12h16M4 19h16" }), _jsx("circle", { cx: "4", cy: "5", r: "0.6" })] }),
    water: _jsx(_Fragment, { children: _jsx("path", { d: "M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z" }) }),
    food: _jsxs(_Fragment, { children: [_jsx("path", { d: "M12 21V9" }), _jsx("path", { d: "M12 9c0-3 2-6 6-6 0 4-2 6-6 6z" }), _jsx("path", { d: "M12 13c0-3-2-5-5-5 0 3 2 5 5 5z" })] }),
    energy: _jsx(_Fragment, { children: _jsx("path", { d: "M13 2 4 14h7l-1 8 9-12h-7l1-8z" }) }),
    sanitation: _jsxs(_Fragment, { children: [_jsx("path", { d: "M6 3h12l-1 7H7L6 3z" }), _jsx("path", { d: "M7 10c-1 4-1 7 5 11 6-4 6-7 5-11" })] }),
    soil: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 15h18" }), _jsx("path", { d: "M5 15c0-3 3-5 7-5s7 2 7 5" }), _jsx("path", { d: "M12 10V4M9 6l3-2 3 2" })] }),
    shelter: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 11 12 4l9 7" }), _jsx("path", { d: "M5 10v10h14V10" }), _jsx("path", { d: "M10 20v-6h4v6" })] }),
    plus: _jsx(_Fragment, { children: _jsx("path", { d: "M12 5v14M5 12h14" }) }),
    close: _jsx(_Fragment, { children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) }),
    zoomIn: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "M11 8v6M8 11h6M20 20l-4.3-4.3" })] }),
    zoomOut: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "M8 11h6M20 20l-4.3-4.3" })] }),
    fit: _jsx(_Fragment, { children: _jsx("path", { d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" }) }),
    alert: _jsxs(_Fragment, { children: [_jsx("path", { d: "M12 3 2 20h20L12 3z" }), _jsx("path", { d: "M12 10v4M12 17h.01" })] }),
    info: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 11v5M12 8h.01" })] }),
    trash: _jsx(_Fragment, { children: _jsx("path", { d: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" }) }),
    check: _jsx(_Fragment, { children: _jsx("path", { d: "M4 12.5 9.5 18 20 6" }) }),
};
export function Icon({ name, size = 18 }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: paths[name] ?? paths.info }));
}
export const CATEGORY_ICON = {
    water: 'water',
    food: 'food',
    energy: 'energy',
    sanitation: 'sanitation',
    soil: 'soil',
    shelter: 'shelter',
};
export const CATEGORY_LABEL = {
    water: 'Water',
    food: 'Food',
    energy: 'Energy',
    sanitation: 'Sanitation',
    soil: 'Soil & fertility',
    shelter: 'Shelter',
};
/* ------------------------------ small bits ------------------------------ */
export function Field({ label, value, children, }) {
    return (_jsxs("div", { className: "field", children: [_jsxs("label", { children: [label, value !== undefined && _jsx("span", { className: "value", style: { float: 'right' }, children: value })] }), children] }));
}
export function Meter({ value, tone = 'accent' }) {
    const clamped = Math.max(0, Math.min(1, value));
    return (_jsx("div", { style: {
            height: 6, borderRadius: 3, background: 'var(--surface-sunk)',
            overflow: 'hidden', border: '1px solid var(--border)',
        }, role: "img", "aria-label": `${Math.round(clamped * 100)} percent`, children: _jsx("div", { style: {
                width: `${clamped * 100}%`, height: '100%',
                background: tone === 'warn' ? 'var(--status-serious)' : 'var(--accent)',
                borderRadius: 3,
            } }) }));
}
