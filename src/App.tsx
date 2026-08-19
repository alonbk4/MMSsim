import { useEffect, useRef, useState } from 'react';
import { DESIGN_VERSION } from './engine/defaults';
import type { Design } from './engine/types';
import { useApp, type Tab } from './state/store';
import { CatalogPane } from './ui/CatalogPane';
import { Icon } from './ui/common';
import { DesignPane } from './ui/DesignPane';
import { ResultsPane } from './ui/ResultsPane';
import { SitePane } from './ui/SitePane';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'site', label: 'Site', icon: 'site' },
  { id: 'design', label: 'Yard', icon: 'design' },
  { id: 'results', label: 'Results', icon: 'results' },
  { id: 'catalog', label: 'Catalog', icon: 'catalog' },
];

type Theme = 'system' | 'light' | 'dark';

export default function App() {
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const siteName = useApp((s) => s.design.site.name);
  const [menu, setMenu] = useState(false);

  return (
    <div className="app">
      <div className="main">
        <div className="topbar">
          <span className="mark" aria-hidden="true">M</span>
          <span className="site-name">{siteName || 'My yard'}</span>
          <span className="spacer" />
          <ThemeToggle />
          <button className="btn small" onClick={() => setMenu((v) => !v)} aria-expanded={menu}>
            File
          </button>
        </div>

        {menu && <DesignMenu onClose={() => setMenu(false)} />}

        {tab === 'site' && <SitePane />}
        {tab === 'design' && <DesignPane />}
        {tab === 'results' && <ResultsPane />}
        {tab === 'catalog' && <CatalogPane />}
      </div>

      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            aria-current={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('mmssim.theme') as Theme) || 'system',
  );
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    localStorage.setItem('mmssim.theme', theme);
  }, [theme]);

  const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
  const label: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };
  return (
    <button className="btn small" onClick={() => setTheme(next[theme])} title="Appearance">
      {label[theme]}
    </button>
  );
}

function DesignMenu({ onClose }: { onClose: () => void }) {
  const design = useApp((s) => s.design);
  const reset = useApp((s) => s.reset);
  const loadDesign = useApp((s) => s.loadDesign);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const importDesign = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Design;
      if (parsed.version !== DESIGN_VERSION || !Array.isArray(parsed.placements)) {
        throw new Error('Not a design file from this version.');
      }
      loadDesign(parsed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  return (
    <div className="card" style={{ margin: '10px 14px 0', borderRadius: 12 }}>
      <div className="row wrap">
        <button className="btn small" onClick={exportDesign}>Export design</button>
        <button className="btn small" onClick={() => fileRef.current?.click()}>Import design</button>
        <span className="grow" />
        <button
          className="btn small danger"
          onClick={() => {
            if (confirm('Replace the current design with the starter one? This cannot be undone.')) {
              reset();
              onClose();
            }
          }}
        >
          Start over
        </button>
        <button className="btn small" onClick={onClose} aria-label="Close menu">
          <Icon name="close" size={14} />
        </button>
      </div>
      {error && <p className="card-note" style={{ color: 'var(--status-critical)', marginTop: 8 }}>{error}</p>}
      <input
        ref={fileRef} type="file" accept="application/json" className="visually-hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importDesign(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
