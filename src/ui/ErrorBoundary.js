import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
const STORAGE_KEY = 'mmssim.design.v1';
export class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        // Kept for the console so a report can include it.
        console.error('MMSsim crashed:', error, info.componentStack);
    }
    rescue = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mmssim-recovered-design.json';
            a.click();
            URL.revokeObjectURL(url);
        }
        catch {
            /* nothing to save */
        }
    };
    reset = () => {
        if (!confirm('Start over with a fresh design? Save a copy first if you have not.'))
            return;
        try {
            localStorage.removeItem(STORAGE_KEY);
        }
        catch { /* ignore */ }
        location.reload();
    };
    render() {
        const { error } = this.state;
        if (!error)
            return this.props.children;
        return (_jsxs("div", { style: { padding: '32px 18px', maxWidth: 640, margin: '0 auto' }, children: [_jsx("h1", { style: { fontSize: '1.15rem', marginBottom: 10 }, children: "Something broke" }), _jsx("p", { style: { color: 'var(--text-secondary)', fontSize: 14 }, children: "The app hit an error and stopped rather than showing you a blank page. Your saved design is still in this browser \u2014 take a copy before doing anything else." }), _jsx("pre", { style: {
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '10px 12px', fontSize: 12,
                        whiteSpace: 'pre-wrap', overflowX: 'auto',
                    }, children: error.message || String(error) }), _jsxs("div", { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }, children: [_jsx("button", { className: "btn primary", onClick: this.rescue, children: "Download my design" }), _jsx("button", { className: "btn", onClick: () => location.reload(), children: "Try again" }), _jsx("button", { className: "btn danger", onClick: this.reset, children: "Start fresh" })] }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }, children: "If this keeps happening, the downloaded file and the message above are everything needed to work out why." })] }));
    }
}
