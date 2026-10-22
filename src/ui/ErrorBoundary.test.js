import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
function Boom() {
    throw new Error('the canvas exploded');
}
let container;
let root;
beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    // React logs caught errors; that is expected here and only adds noise.
    vi.spyOn(console, 'error').mockImplementation(() => { });
});
afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
});
describe('the last line of defence', () => {
    it('shows the children when nothing is wrong', () => {
        act(() => {
            root.render(_jsx(StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx("p", { children: "the app" }) }) }));
        });
        expect(container.textContent).toContain('the app');
    });
    it('catches a crash instead of rendering nothing', () => {
        act(() => {
            root.render(_jsx(StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(Boom, {}) }) }));
        });
        // The failure mode being defended against is an empty page.
        expect(container.textContent).not.toBe('');
        expect(container.textContent).toContain('Something broke');
        // And the actual message, so a report can say what happened.
        expect(container.textContent).toContain('the canvas exploded');
    });
    it('offers to rescue the design before offering to bin it', () => {
        act(() => {
            root.render(_jsx(StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(Boom, {}) }) }));
        });
        const labels = [...container.querySelectorAll('button')].map((b) => b.textContent);
        expect(labels).toContain('Download my design');
        expect(labels).toContain('Start fresh');
        // Rescue must come first: someone panicking clicks the first button.
        expect(labels.indexOf('Download my design')).toBeLessThan(labels.indexOf('Start fresh'));
    });
    it('hands back whatever is in storage when asked to rescue', () => {
        localStorage.setItem('mmssim.design.v1', '{"state":{"design":{"version":3}}}');
        const clicked = [];
        // jsdom has no object URLs, so these are defined rather than spied on.
        Object.assign(URL, {
            createObjectURL: vi.fn(() => 'blob:stub'),
            revokeObjectURL: vi.fn(),
        });
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            clicked.push(this.download);
        });
        act(() => {
            root.render(_jsx(StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(Boom, {}) }) }));
        });
        const rescue = [...container.querySelectorAll('button')]
            .find((b) => b.textContent === 'Download my design');
        act(() => { rescue.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
        expect(clicked).toContain('mmssim-recovered-design.json');
    });
    it('does not wipe anything without being asked twice', () => {
        localStorage.setItem('mmssim.design.v1', 'precious');
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        act(() => {
            root.render(_jsx(StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(Boom, {}) }) }));
        });
        const reset = [...container.querySelectorAll('button')]
            .find((b) => b.textContent === 'Start fresh');
        act(() => { reset.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
        expect(localStorage.getItem('mmssim.design.v1')).toBe('precious');
    });
});
