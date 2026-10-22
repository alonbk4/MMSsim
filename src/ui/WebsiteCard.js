import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { statusesFor, statusSignature } from '../engine/websiteSync';
import { useApp } from '../state/store';
import { useWebsite } from '../state/website';
import { Field } from './common';
/**
 * The connection to the yard's website. What gets recorded here — works,
 * partly worked, didn't work — is what the website's systems menu shows.
 */
export function WebsiteCard() {
    const design = useApp((s) => s.design);
    const w = useWebsite();
    const [showKey, setShowKey] = useState(false);
    const ready = !!w.address.trim() && !!w.key.trim();
    const unsent = ready && statusSignature(statusesFor(design)) !== w.lastSent;
    let line;
    if (!ready)
        line = 'Not connected.';
    else if (w.busy)
        line = 'Sending…';
    else if (w.last && !w.last.ok)
        line = w.last.message;
    else if (unsent)
        line = w.auto ? 'Changes waiting to send…' : 'Changes not sent yet.';
    else if (w.last)
        line = `Sent ${ago(w.last.at)}. ${w.last.message}`;
    else
        line = 'Connected, nothing sent yet.';
    return (_jsxs("div", { className: "card", children: [_jsx("header", { children: _jsx("h2", { children: "Website" }) }), _jsxs("div", { className: "stack", children: [_jsx("p", { className: "card-note", children: "Send each system's status to your website, so its systems menu shows what actually happened here. A system you mark as tested is published there." }), _jsx(Field, { label: "Website address", children: _jsx("input", { type: "url", inputMode: "url", placeholder: "https://your-site.com", autoCapitalize: "off", autoCorrect: "off", spellCheck: false, value: w.address, onChange: (e) => w.setConnection({ address: e.target.value }) }) }), _jsx(Field, { label: "Sync key", children: _jsxs("div", { className: "row", children: [_jsx("input", { type: showKey ? 'text' : 'password', autoComplete: "off", spellCheck: false, style: { flex: 1, minWidth: 0 }, value: w.key, onChange: (e) => w.setConnection({ key: e.target.value }) }), _jsx("button", { className: "btn small", type: "button", onClick: () => setShowKey((v) => !v), children: showKey ? 'Hide' : 'Show' })] }) }), _jsx("p", { className: "card-note", children: "Both are in WordPress under Settings \u2192 Yard site. The key stays on this device and is never part of an exported design." }), _jsxs("label", { className: "row", style: { fontSize: 14 }, children: [_jsx("input", { type: "checkbox", checked: w.auto, onChange: (e) => w.setConnection({ auto: e.target.checked }) }), "Send status changes automatically"] }), _jsxs("div", { className: "row wrap", children: [_jsx("button", { className: "btn primary", type: "button", disabled: !ready || w.busy, onClick: () => void w.send(design, true), children: w.busy ? 'Sending…' : 'Send statuses now' }), _jsx("span", { className: "card-note", role: "status", style: w.last && !w.last.ok && !w.busy ? { color: 'var(--status-critical)' } : undefined, children: line })] }), w.last?.ok && w.last.changed.length > 0 && (_jsx("ul", { className: "card-note", style: { margin: 0, paddingLeft: 18 }, children: w.last.changed.map((c, i) => (_jsxs("li", { children: [_jsx("strong", { children: c.title }), ": ", c.change] }, i))) }))] })] }));
}
function ago(at) {
    const s = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (s < 60)
        return 'just now';
    const m = Math.round(s / 60);
    if (m < 60)
        return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24)
        return `${h} h ago`;
    return new Date(at).toLocaleDateString();
}
