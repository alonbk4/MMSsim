import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { bandCentreline, bandPath, blobPath, hash, mulberry } from '../../engine/footprint';
import { PlanGlyph } from './glyphs';
/** Hairlines that ignore the group's scale transform. */
const HAIR = { vectorEffect: 'non-scaling-stroke' };
/* ====================================================================== */
/*  Shared defs                                                            */
/* ====================================================================== */
const CATEGORIES = ['water', 'food', 'energy', 'sanitation', 'soil', 'shelter'];
/**
 * Shared paint. The ripple fill has to be declared once per category: a
 * `<pattern>` resolves CSS custom properties where it is *defined*, not where
 * it is referenced, so a single shared pattern inherits nothing and paints
 * black.
 */
export function PlanDefs() {
    return (_jsxs("defs", { children: [CATEGORIES.map((c) => (_jsx("g", { className: `cat-${c}`, children: _jsx("pattern", { id: `ripple-${c}`, width: "1.15", height: "0.7", patternUnits: "userSpaceOnUse", children: _jsx("path", { d: "M0,0.35 q0.29,-0.2 0.575,0 t0.575,0", fill: "none", stroke: "var(--cat-ink)", strokeWidth: "0.085", opacity: "0.4" }) }) }, c))), _jsx("filter", { id: "ill-shadow", x: "-30%", y: "-30%", width: "170%", height: "170%", children: _jsx("feDropShadow", { dx: "0", dy: "0.12", stdDeviation: "0.14", floodOpacity: "0.28" }) }), _jsxs("linearGradient", { id: "ill-sheen", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#fff", stopOpacity: "0.22" }), _jsx("stop", { offset: "60%", stopColor: "#fff", stopOpacity: "0" })] })] }));
}
/* ====================================================================== */
/*  Illustrated                                                            */
/* ====================================================================== */
export function paintIllustrated({ def, fp, scale, seed }) {
    const s = fp.shape;
    const ink = 'var(--cat-ink)';
    // A yard is mostly food systems, and fifteen identically green rectangles
    // blur together. Each system gets a small fixed step toward its category's
    // lighter tone, so neighbours separate without leaving the palette.
    const step = (hash(def.id) % 5) * 5.5;
    // Something you tried that failed is drained of its colour on the plan, so a
    // yard full of green does not quietly include the bed that never took.
    const failed = def.evidence === 'testedFailed';
    const fill = failed
        ? 'var(--surface-2)'
        : `color-mix(in oklab, var(--cat-fill) ${100 - step}%, var(--cat-lift))`;
    const lift = failed ? 'var(--surface-1)' : 'var(--cat-lift)';
    const detail = scale > 7;
    const r = (v) => Math.min(0.45, v * 0.16);
    switch (s.kind) {
        case 'block':
            return (_jsxs("g", { filter: "url(#ill-shadow)", children: [_jsx("rect", { width: s.w, height: s.h, rx: r(Math.min(s.w, s.h)), fill: fill, stroke: ink, strokeWidth: "1.6", style: HAIR }), detail && s.rows > 0 && Array.from({ length: s.rows }, (_, i) => (_jsx("rect", { x: s.w * 0.06, width: s.w * 0.88, y: (i + 0.22) * (s.h / s.rows), height: (s.h / s.rows) * 0.42, rx: (s.h / s.rows) * 0.2, fill: ink, opacity: "0.28" }, i))), _jsx("rect", { width: s.w, height: s.h * 0.5, rx: r(Math.min(s.w, s.h)), fill: "url(#ill-sheen)" }), _jsx(PlanGlyph, { def: def, w: s.w, h: s.h, tone: ink, hidden: !detail, badge: true, scale: scale })] }));
        case 'roof':
            return (_jsxs("g", { filter: "url(#ill-shadow)", children: [_jsx("rect", { width: s.w, height: s.h, rx: r(Math.min(s.w, s.h)), fill: lift, stroke: ink, strokeWidth: "1.6", style: HAIR }), detail && s.grid === 'panels' && _jsx(PanelTiles, { w: s.w, h: s.h, fill: ink }), detail && s.grid === 'sheets' && Array.from({ length: 5 }, (_, i) => (_jsx("rect", { x: (i * s.w) / 5 + s.w * 0.012, y: s.h * 0.08, width: s.w / 5 - s.w * 0.024, height: s.h * 0.84, rx: s.w * 0.01, fill: ink, opacity: "0.14" }, i))), _jsx(PlanGlyph, { def: def, w: s.w, h: s.h, tone: ink, hidden: !detail, badge: true, scale: scale })] }));
        case 'disc':
            return (_jsxs("g", { filter: "url(#ill-shadow)", children: [_jsx("circle", { cx: s.r, cy: s.r, r: s.r, fill: fill, stroke: ink, strokeWidth: "1.6", style: HAIR }), detail && _jsx("circle", { cx: s.r, cy: s.r, r: s.r * 0.66, fill: lift, opacity: "0.7" }), _jsx("path", { d: `M0,${s.r} a${s.r},${s.r} 0 0 1 ${s.r * 2},0 Z`, fill: "url(#ill-sheen)" }), _jsx(PlanGlyph, { def: def, w: s.w, h: s.h, tone: ink, hidden: !detail, badge: true, scale: scale })] }));
        case 'blob': {
            const d = blobPath(s.w, s.h, seed);
            const inner = blobPath(s.w * 0.7, s.h * 0.66, seed + 7);
            const isWater = def.category === 'water' || def.id === 'water-pond' || def.id === 'duckweed-pond';
            return (_jsxs("g", { filter: "url(#ill-shadow)", children: [_jsx("path", { d: d, fill: fill, stroke: ink, strokeWidth: "1.6", style: HAIR }), detail && (_jsx("g", { transform: `translate(${s.w * 0.15},${s.h * 0.17})`, children: _jsx("path", { d: inner, fill: lift, opacity: isWater ? 0.85 : 0.5 }) })), detail && isWater && _jsx("path", { d: d, fill: `url(#ripple-${def.category})` }), detail && !isWater && _jsx(CanopyDots, { w: s.w, h: s.h, seed: seed, fill: ink })] }));
        }
        case 'band': {
            const d = bandPath(s.w, s.thickness, seed);
            return (_jsxs("g", { filter: "url(#ill-shadow)", children: [_jsx("path", { d: d, fill: fill, stroke: ink, strokeWidth: "1.6", strokeLinejoin: "round", style: HAIR }), detail && (_jsx("path", { d: bandCentreline(s.w, s.thickness, seed), fill: "none", stroke: lift, strokeWidth: s.thickness * 0.3, strokeLinecap: "round", opacity: "0.8" }))] }));
        }
        case 'cells':
            return (_jsxs("g", { filter: "url(#ill-shadow)", children: [Array.from({ length: s.count }, (_, i) => (_jsx("rect", { x: (i * s.w) / s.count + s.w * 0.008, y: 0, width: s.w / s.count - s.w * 0.016, height: s.h, rx: r(Math.min(s.w / s.count, s.h)), fill: i % 2 ? lift : fill, stroke: ink, strokeWidth: "1.5", style: HAIR }, i))), _jsx(PlanGlyph, { def: def, w: s.w, h: s.h, tone: ink, hidden: !detail, badge: true, scale: scale })] }));
        case 'enclosure':
            return (_jsxs("g", { filter: "url(#ill-shadow)", children: [_jsx("rect", { width: s.w, height: s.h, rx: r(Math.min(s.w, s.h)), fill: fill, stroke: ink, strokeWidth: "1.6", strokeDasharray: "3 2", style: HAIR }), _jsx("rect", { x: s.w - s.hut - 0.2, y: 0.2, width: s.hut, height: s.hut, rx: s.hut * 0.18, fill: ink, opacity: "0.75" }), _jsx(PlanGlyph, { def: def, w: s.w - s.hut, h: s.h, tone: ink, hidden: !detail, badge: true, scale: scale })] }));
        case 'cluster':
            return (_jsx(_Fragment, { children: s.items.map((it, i) => (_jsxs("g", { filter: "url(#ill-shadow)", children: [_jsx("circle", { cx: it.x, cy: it.y, r: it.r, fill: fill, stroke: ink, strokeWidth: "1.4", style: HAIR }), detail && _jsx("circle", { cx: it.x - it.r * 0.22, cy: it.y - it.r * 0.24, r: it.r * 0.46, fill: lift, opacity: "0.85" })] }, i))) }));
    }
}
/* ====================================================================== */
/*  Small shared pieces                                                    */
/* ====================================================================== */
function PanelTiles({ w, h, fill }) {
    const cols = Math.max(2, Math.round(w / 1.7));
    const rows = Math.max(1, Math.round(h / 1.1));
    const gap = Math.min(w, h) * 0.03;
    const tiles = [];
    for (let c = 0; c < cols; c++) {
        for (let rw = 0; rw < rows; rw++) {
            tiles.push(_jsx("rect", { x: (c * w) / cols + gap, y: (rw * h) / rows + gap, width: w / cols - gap * 2, height: h / rows - gap * 2, rx: gap, fill: fill, opacity: "0.5" }, `${c}-${rw}`));
        }
    }
    return _jsx(_Fragment, { children: tiles });
}
function CanopyDots({ w, h, seed, fill }) {
    const rnd = mulberry(seed + 3);
    const n = Math.min(9, Math.max(3, Math.round((w * h) / 12)));
    return (_jsx(_Fragment, { children: Array.from({ length: n }, (_, i) => (_jsx("circle", { cx: w * (0.18 + rnd() * 0.64), cy: h * (0.18 + rnd() * 0.64), r: Math.min(w, h) * 0.055, fill: fill, opacity: "0.35" }, i))) }));
}
export { paintIllustrated as paintPlan };
