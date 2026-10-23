import { useState } from 'react';
import { liveEntries } from '../engine/yardLog';
import { useApp } from '../state/store';
import { syncSignature, useWebsite } from '../state/website';
import { useYardLog } from '../state/yardLog';
import { Field } from './common';

/**
 * The connection to the yard's website. The yard log is kept there, so every
 * device shares it, and what it records (works, partly worked, didn't work)
 * is what the website's systems menu shows.
 */
export function WebsiteCard() {
  const design = useApp((s) => s.design);
  const w = useWebsite();
  const log = useYardLog();
  const [showKey, setShowKey] = useState(false);

  const ready = !!w.address.trim() && !!w.key.trim();
  const unsent = ready && syncSignature(design) !== w.lastSent;
  const entries = liveEntries(log.entries);
  const hidden = entries.filter((e) => e.private).length;

  let line: string;
  if (!ready) line = 'Not connected.';
  else if (w.busy) line = 'Syncing…';
  else if (w.last && !w.last.ok) line = w.last.message;
  else if (unsent) line = w.auto ? 'Changes waiting to sync…' : 'Changes not synced yet.';
  else if (w.last) line = `Synced ${ago(w.last.at)}. ${w.last.message}`;
  else line = 'Connected, not synced yet.';

  return (
    <div className="card">
      <header><h2>Website</h2></header>
      <div className="stack">
        <p className="card-note">
          Keep the yard log on your website, so every device you use reads and adds to
          the same record. Its public entries show on each system's page, each
          system's status follows its latest result, and a system with a result is
          published there.
        </p>
        <Field label="Website address">
          <input
            type="url" inputMode="url" placeholder="https://your-site.com"
            autoCapitalize="off" autoCorrect="off" spellCheck={false}
            value={w.address}
            onChange={(e) => w.setConnection({ address: e.target.value })}
          />
        </Field>
        <Field label="Sync key">
          <div className="row">
            <input
              type={showKey ? 'text' : 'password'} autoComplete="off" spellCheck={false}
              style={{ flex: 1, minWidth: 0 }}
              value={w.key}
              onChange={(e) => w.setConnection({ key: e.target.value })}
            />
            <button className="btn small" type="button" onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <p className="card-note">
          Both are in WordPress under Settings → Yard site. The key stays on this
          device and is never part of an exported design. Connect each device you
          use: anything recorded on one before it was connected joins the log.
        </p>
        <label className="row" style={{ fontSize: 14 }}>
          <input
            type="checkbox" checked={w.auto}
            onChange={(e) => w.setConnection({ auto: e.target.checked })}
          />
          Sync automatically
        </label>
        <div className="row wrap">
          <button
            className="btn primary" type="button"
            disabled={!ready || w.busy}
            onClick={() => void w.send(design, true)}
          >
            {w.busy ? 'Syncing…' : 'Sync now'}
          </button>
          <span
            className="card-note" role="status"
            style={w.last && !w.last.ok && !w.busy ? { color: 'var(--status-critical)' } : undefined}
          >
            {line}
          </span>
        </div>
        <p className="meta-line" style={{ margin: 0 }}>
          Yard log: {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          {hidden > 0 && `, ${hidden} private`}
          {log.pending.length > 0 && ` · ${log.pending.length} ${log.pending.length === 1 ? 'photo' : 'photos'} waiting to send`}
        </p>
        {w.last && w.last.changed.length > 0 && (
          <ul className="card-note" style={{ margin: 0, paddingLeft: 18 }}>
            {w.last.changed.map((c, i) => (
              <li key={i}><strong>{c.title}</strong>: {c.change}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ago(at: number): string {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(at).toLocaleDateString();
}
