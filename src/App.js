import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { DESIGN_VERSION } from './engine/defaults';
import { useApp } from './state/store';
import { startWebsiteSync } from './state/website';
import { CatalogPane } from './ui/CatalogPane';
import { Icon } from './ui/common';
import { DesignPane } from './ui/DesignPane';
import { ResultsPane } from './ui/ResultsPane';
import { SitePane } from './ui/SitePane';
const TABS = [
    { id: 'site', label: 'Site', icon: 'site' },
    { id: 'design', label: 'Yard', icon: 'design' },
    { id: 'results', label: 'Results', icon: 'results' },
    { id: 'catalog', label: 'Catalog', icon: 'catalog' },
];
export default function App() {
    const tab = useApp((s) => s.tab);
    const setTab = useApp((s) => s.setTab);
    const siteName = useApp((s) => s.design.site.name);
    const [menu, setMenu] = useState(false);
    // Results recorded here go to the yard's website, if one is connected.
    useEffect(() => startWebsiteSync(), []);
    return (_jsxs("div", { className: "app", children: [_jsxs("div", { className: "main", children: [_jsxs("div", { className: "topbar", children: [_jsx("span", { className: "mark", "aria-hidden": "true", children: "M" }), _jsx("span", { className: "site-name", children: siteName || 'My yard' }), _jsx("span", { className: "spacer" }), _jsx(ThemeToggle, {}), _jsx("button", { className: "btn small", onClick: () => setMenu((v) => !v), "aria-expanded": menu, children: "File" })] }), menu && _jsx(DesignMenu, { onClose: () => setMenu(false) }), tab === 'site' && _jsx(SitePane, {}), tab === 'design' && _jsx(DesignPane, {}), tab === 'results' && _jsx(ResultsPane, {}), tab === 'catalog' && _jsx(CatalogPane, {})] }), _jsx("nav", { className: "tabs", "aria-label": "Sections", children: TABS.map((t) => (_jsxs("button", { "aria-current": tab === t.id, onClick: () => setTab(t.id), children: [_jsx(Icon, { name: t.icon }), t.label] }, t.id))) })] }));
}
function ThemeToggle() {
    const [theme, setTheme] = useState(() => localStorage.getItem('mmssim.theme') || 'system');
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'system')
            root.removeAttribute('data-theme');
        else
            root.setAttribute('data-theme', theme);
        localStorage.setItem('mmssim.theme', theme);
    }, [theme]);
    const next = { system: 'light', light: 'dark', dark: 'system' };
    const label = { system: 'Auto', light: 'Light', dark: 'Dark' };
    return (_jsx("button", { className: "btn small", onClick: () => setTheme(next[theme]), title: "Appearance", children: label[theme] }));
}
function DesignMenu({ onClose }) {
    const design = useApp((s) => s.design);
    const reset = useApp((s) => s.reset);
    const loadDesign = useApp((s) => s.loadDesign);
    const fileRef = useRef(null);
    const [error, setError] = useState(null);
    const exportDesign = () => {
        const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(design.site.name || 'yard').replace(/\W+/g, '-').toLowerCase()}-design.json`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
    };
    const importDesign = async (file) => {
        try {
            const parsed = JSON.parse(await file.text());
            if (parsed.version !== DESIGN_VERSION || !Array.isArray(parsed.placements)) {
                throw new Error('Not a design file from this version.');
            }
            loadDesign(parsed);
            onClose();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Could not read that file.');
        }
    };
    return (_jsxs("div", { className: "card", style: { margin: '10px 14px 0', borderRadius: 12 }, children: [_jsxs("div", { className: "row wrap", children: [_jsx("button", { className: "btn small", onClick: exportDesign, children: "Export design" }), _jsx("button", { className: "btn small", onClick: () => fileRef.current?.click(), children: "Import design" }), _jsx("span", { className: "grow" }), _jsx("button", { className: "btn small danger", onClick: () => {
                            if (confirm('Replace the current design with the starter one? This cannot be undone.')) {
                                reset();
                                onClose();
                            }
                        }, children: "Start over" }), _jsx("button", { className: "btn small", onClick: onClose, "aria-label": "Close menu", children: _jsx(Icon, { name: "close", size: 14 }) })] }), error && _jsx("p", { className: "card-note", style: { color: 'var(--status-critical)', marginTop: 8 }, children: error }), _jsx("input", { ref: fileRef, type: "file", accept: "application/json", className: "visually-hidden", onChange: (e) => {
                    const f = e.target.files?.[0];
                    if (f)
                        void importDesign(f);
                    e.target.value = '';
                } })] }));
}
