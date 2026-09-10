import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * The last line of defence against a white screen.
 *
 * This is a local-first app: the design lives in this browser and nowhere
 * else, so a crash that renders nothing leaves someone with no page, no
 * explanation and no way back — and clearing site data would throw away the
 * yard along with the fault. Anything that escapes lands here instead, with
 * the error visible and the saved design offered as a download before any
 * suggestion to reset it.
 */
interface Props { children: ReactNode }
interface State { error: Error | null }

const STORAGE_KEY = 'mmssim.design.v1';

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept for the console so a report can include it.
    console.error('MMSsim crashed:', error, info.componentStack);
  }

  private rescue = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mmssim-recovered-design.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* nothing to save */
    }
  };

  private reset = () => {
    if (!confirm('Start over with a fresh design? Save a copy first if you have not.')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ padding: '32px 18px', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.15rem', marginBottom: 10 }}>Something broke</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          The app hit an error and stopped rather than showing you a blank page.
          Your saved design is still in this browser — take a copy before doing
          anything else.
        </p>
        <pre style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 12px', fontSize: 12,
          whiteSpace: 'pre-wrap', overflowX: 'auto',
        }}>
          {error.message || String(error)}
        </pre>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <button className="btn primary" onClick={this.rescue}>Download my design</button>
          <button className="btn" onClick={() => location.reload()}>Try again</button>
          <button className="btn danger" onClick={this.reset}>Start fresh</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}>
          If this keeps happening, the downloaded file and the message above are
          everything needed to work out why.
        </p>
      </div>
    );
  }
}
