import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { MONTHS } from '../engine/climate';
import { RESOURCES } from '../engine/resources';
import { compact } from './common';
/** Width-aware container: charts are drawn at real pixel width so type never
 *  stretches, and they re-draw when the pane or the phone rotates. */
export function useMeasure() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        ro.observe(el);
        setWidth(el.clientWidth);
        return () => ro.disconnect();
    }, []);
    return { ref, width };
}
function niceTicks(max, count = 4) {
    if (max <= 0)
        return [0];
    const raw = max / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    const ticks = [];
    for (let v = 0; v <= max * 1.0001; v += step)
        ticks.push(v);
    return ticks;
}
/**
 * One resource, twelve months.
 *
 * Bars are what the design produces, the line is what it needs, and the third
 * series is what is sitting in storage at month end. All three are the same
 * unit on one axis — there is deliberately no second y-scale anywhere in this
 * app. The whisker on each bar is the evidence band: how far output could fall
 * if the researched and unproven systems come in at the low end.
 */
export function MonthlyResourceChart({ resource, expected, low, high, height = 168, }) {
    const meta = RESOURCES[resource];
    const { ref, width } = useMeasure();
    const [tip, setTip] = useState(null);
    const showStock = expected.capacity > 0;
    const pad = { top: 10, right: 10, bottom: 22, left: 42 };
    const w = Math.max(240, width);
    const plotW = w - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const maxima = expected.months.map((m, i) => Math.max(high.months[i]?.produced ?? 0, m.produced, m.demanded, showStock ? m.stockEnd : 0));
    const rawMax = Math.max(1e-9, ...maxima);
    const ticks = niceTicks(rawMax);
    const top = Math.max(rawMax, ticks[ticks.length - 1]);
    const y = (v) => pad.top + plotH - (v / top) * plotH;
    const band = plotW / 12;
    const barW = Math.max(4, Math.min(20, band * 0.5));
    const cx = (i) => pad.left + band * (i + 0.5);
    const onMove = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const idx = Math.floor((px - pad.left) / band);
        if (idx < 0 || idx > 11) {
            setTip(null);
            return;
        }
        setTip({ month: idx, x: cx(idx), y: e.clientY - rect.top });
    }, [band, pad.left, plotW]);
    const stockPath = showStock
        ? expected.months.map((m, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(m.stockEnd).toFixed(1)}`).join(' ')
        : '';
    const demandPath = expected.months
        .map((m, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(m.demanded).toFixed(1)}`)
        .join(' ');
    const anyDemand = expected.demanded > 0;
    return (_jsxs("div", { ref: ref, children: [_jsxs("svg", { width: w, height: height, role: "img", "aria-label": `${meta.label} by month, in ${meta.unit}`, onPointerMove: onMove, onPointerLeave: () => setTip(null), style: { touchAction: 'pan-y' }, children: [ticks.map((t) => (_jsxs("g", { children: [_jsx("line", { x1: pad.left, x2: w - pad.right, y1: y(t), y2: y(t), stroke: "var(--gridline)", strokeWidth: "1" }), _jsx("text", { x: pad.left - 6, y: y(t) + 3.5, textAnchor: "end", className: "plot-sub", style: { fontVariantNumeric: 'tabular-nums' }, children: compact(t) })] }, t))), expected.months.map((m, i) => {
                        const h = Math.max(0, y(0) - y(m.produced));
                        const lowV = low.months[i]?.produced ?? m.produced;
                        const highV = high.months[i]?.produced ?? m.produced;
                        const short = m.shortfall > Math.max(1e-9, m.demanded * 0.005);
                        return (_jsxs("g", { children: [h > 0 && (_jsx("rect", { x: cx(i) - barW / 2, y: y(m.produced), width: barW, height: h, rx: Math.min(4, barW / 2), fill: "var(--series-1)", opacity: tip && tip.month !== i ? 0.55 : 1 })), highV - lowV > top * 0.01 && (_jsxs("g", { stroke: "var(--text-muted)", strokeWidth: "1.5", strokeLinecap: "round", children: [_jsx("line", { x1: cx(i), x2: cx(i), y1: y(lowV), y2: y(highV) }), _jsx("line", { x1: cx(i) - 3, x2: cx(i) + 3, y1: y(highV), y2: y(highV) }), _jsx("line", { x1: cx(i) - 3, x2: cx(i) + 3, y1: y(lowV), y2: y(lowV) })] })), short && (_jsx("line", { x1: cx(i) - barW / 2, x2: cx(i) + barW / 2, y1: y(0) + 3, y2: y(0) + 3, stroke: "var(--status-critical)", strokeWidth: "2.5", strokeLinecap: "round" }))] }, i));
                    }), showStock && (_jsx("path", { d: stockPath, fill: "none", stroke: "var(--series-3)", strokeWidth: "2", strokeLinejoin: "round" })), anyDemand && (_jsx("path", { d: demandPath, fill: "none", stroke: "var(--series-2)", strokeWidth: "2", strokeLinejoin: "round", strokeDasharray: "1 0" })), _jsx("line", { x1: pad.left, x2: w - pad.right, y1: y(0), y2: y(0), stroke: "var(--baseline)", strokeWidth: "1" }), MONTHS.map((mo, i) => ((i % 2 === 0 || band > 26) && (_jsx("text", { x: cx(i), y: height - 7, textAnchor: "middle", className: "plot-sub", children: mo[0] }, mo)))), tip && (_jsx("line", { x1: cx(tip.month), x2: cx(tip.month), y1: pad.top, y2: y(0), stroke: "var(--border-strong)", strokeWidth: "1" }))] }), tip && (_jsx(MonthTooltip, { resource: resource, month: tip.month, expected: expected, low: low, high: high, showStock: showStock })), _jsxs("div", { className: "legend", style: { marginTop: 4 }, children: [_jsxs("span", { className: "key", children: [_jsx("span", { className: "swatch", style: { background: 'var(--series-1)' } }), " Produced"] }), anyDemand && (_jsxs("span", { className: "key", children: [_jsx("span", { className: "swatch line", style: { background: 'var(--series-2)' } }), " Needed"] })), showStock && (_jsxs("span", { className: "key", children: [_jsx("span", { className: "swatch line", style: { background: 'var(--series-3)' } }), " In storage"] })), _jsxs("span", { className: "key", children: [_jsx("span", { className: "swatch line", style: { background: 'var(--text-muted)', width: 2, height: 10 } }), " Evidence range"] })] }), _jsxs("details", { className: "disclosure", children: [_jsxs("summary", { children: ["Show the numbers (", meta.unit, ")"] }), _jsx("div", { className: "scroll-x", children: _jsxs("table", { className: "data", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Month" }), _jsx("th", { children: "Produced" }), _jsx("th", { children: "Needed" }), showStock && _jsx("th", { children: "Stored" }), _jsx("th", { children: "Short by" })] }) }), _jsx("tbody", { children: expected.months.map((m, i) => (_jsxs("tr", { children: [_jsx("td", { children: MONTHS[i] }), _jsx("td", { children: compact(m.produced) }), _jsx("td", { children: compact(m.demanded) }), showStock && _jsx("td", { children: compact(m.stockEnd) }), _jsx("td", { style: { color: m.shortfall > 0 ? 'var(--status-critical)' : 'var(--text-muted)' }, children: m.shortfall > 0 ? compact(m.shortfall) : '—' })] }, i))) })] }) })] })] }));
}
function MonthTooltip({ resource, month, expected, low, high, showStock, }) {
    const meta = RESOURCES[resource];
    const m = expected.months[month];
    const lo = low.months[month];
    const hi = high.months[month];
    return (_jsxs("div", { style: {
            border: '1px solid var(--border)', borderRadius: 10,
            background: 'var(--surface-2)', padding: '8px 10px',
            fontSize: 12.5, marginTop: 6,
        }, children: [_jsx("strong", { children: MONTHS[month] }), ' · ', _jsx("span", { style: { color: 'var(--text-secondary)' }, children: meta.unit }), _jsxs("div", { style: { marginTop: 4, display: 'grid', gap: 2 }, children: [_jsxs("span", { children: [_jsx("span", { style: { color: 'var(--series-1)' }, children: "\u25A0" }), " Produced", ' ', _jsx("strong", { style: { fontVariantNumeric: 'tabular-nums' }, children: compact(m.produced) }), ' ', _jsxs("span", { style: { color: 'var(--text-muted)' }, children: ["(", compact(lo?.produced ?? 0), "\u2013", compact(hi?.produced ?? 0), " across the evidence range)"] })] }), m.demanded > 0 && (_jsxs("span", { children: [_jsx("span", { style: { color: 'var(--series-2)' }, children: "\u25AC" }), " Needed", ' ', _jsx("strong", { style: { fontVariantNumeric: 'tabular-nums' }, children: compact(m.demanded) })] })), showStock && (_jsxs("span", { children: [_jsx("span", { style: { color: 'var(--series-3)' }, children: "\u25AC" }), " In storage", ' ', _jsx("strong", { style: { fontVariantNumeric: 'tabular-nums' }, children: compact(m.stockEnd) }), ' of ', compact(m.capacity)] })), m.shortfall > 0 && (_jsxs("span", { style: { color: 'var(--status-critical)' }, children: ["\u26A0 Short by ", _jsx("strong", { children: compact(m.shortfall) })] }))] })] }));
}
/** One series: hours of usable sun per day, month by month. */
export function SunHoursChart({ hours, height = 112 }) {
    const { ref, width } = useMeasure();
    const pad = { top: 8, right: 8, bottom: 20, left: 30 };
    const w = Math.max(240, width);
    const plotW = w - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const ticks = niceTicks(Math.max(1, ...hours), 3);
    const top = Math.max(...hours, ticks[ticks.length - 1], 1);
    const y = (v) => pad.top + plotH - (v / top) * plotH;
    const band = plotW / 12;
    const cx = (i) => pad.left + band * (i + 0.5);
    const barW = Math.max(4, Math.min(18, band * 0.55));
    return (_jsx("div", { ref: ref, children: _jsxs("svg", { width: w, height: height, role: "img", "aria-label": "Hours of usable sun per day, by month", children: [ticks.map((t) => (_jsxs("g", { children: [_jsx("line", { x1: pad.left, x2: w - pad.right, y1: y(t), y2: y(t), stroke: "var(--gridline)" }), _jsx("text", { x: pad.left - 5, y: y(t) + 3.5, textAnchor: "end", className: "plot-sub", children: compact(t) })] }, t))), hours.map((v, i) => (_jsx("rect", { x: cx(i) - barW / 2, y: y(v), width: barW, height: Math.max(0, y(0) - y(v)), rx: Math.min(4, barW / 2), fill: "var(--status-warning)" }, i))), _jsx("line", { x1: pad.left, x2: w - pad.right, y1: y(0), y2: y(0), stroke: "var(--baseline)" }), MONTHS.map((mo, i) => (_jsx("text", { x: cx(i), y: height - 6, textAnchor: "middle", className: "plot-sub", children: mo[0] }, mo)))] }) }));
}
/** Two mm-per-month series on one axis: what falls, and what evaporates. */
export function ClimateChart({ rainfall, eto, height = 130, }) {
    const { ref, width } = useMeasure();
    const pad = { top: 8, right: 8, bottom: 20, left: 36 };
    const w = Math.max(240, width);
    const plotW = w - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const top = Math.max(1, ...rainfall, ...eto);
    const ticks = niceTicks(top, 3);
    const scaleTop = Math.max(top, ticks[ticks.length - 1]);
    const y = (v) => pad.top + plotH - (v / scaleTop) * plotH;
    const band = plotW / 12;
    const cx = (i) => pad.left + band * (i + 0.5);
    const barW = Math.max(4, Math.min(18, band * 0.52));
    return (_jsxs("div", { ref: ref, children: [_jsxs("svg", { width: w, height: height, role: "img", "aria-label": "Rainfall and evaporative demand by month, millimetres", children: [ticks.map((t) => (_jsxs("g", { children: [_jsx("line", { x1: pad.left, x2: w - pad.right, y1: y(t), y2: y(t), stroke: "var(--gridline)" }), _jsx("text", { x: pad.left - 5, y: y(t) + 3.5, textAnchor: "end", className: "plot-sub", children: compact(t) })] }, t))), rainfall.map((v, i) => (_jsx("rect", { x: cx(i) - barW / 2, y: y(v), width: barW, height: Math.max(0, y(0) - y(v)), rx: Math.min(4, barW / 2), fill: "var(--series-1)" }, i))), _jsx("path", { d: eto.map((v, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '), fill: "none", stroke: "var(--series-2)", strokeWidth: "2", strokeLinejoin: "round" }), _jsx("line", { x1: pad.left, x2: w - pad.right, y1: y(0), y2: y(0), stroke: "var(--baseline)" }), MONTHS.map((mo, i) => (_jsx("text", { x: cx(i), y: height - 6, textAnchor: "middle", className: "plot-sub", children: mo[0] }, mo)))] }), _jsxs("div", { className: "legend", children: [_jsxs("span", { className: "key", children: [_jsx("span", { className: "swatch", style: { background: 'var(--series-1)' } }), " Rain (mm)"] }), _jsxs("span", { className: "key", children: [_jsx("span", { className: "swatch line", style: { background: 'var(--series-2)' } }), " Evaporative demand (mm)"] })] })] }));
}
