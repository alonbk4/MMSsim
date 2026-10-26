import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ANN_ARBOR_LOG, formatLogDate, liveEntries, localDate, logBySeason,
  type LogEntry, type LogResult, type Season,
} from '../engine/yardLog';
import { keptPhoto, preparePhoto } from '../state/photos';
import { systemById, useApp } from '../state/store';
import { useYardLog } from '../state/yardLog';
import { CATEGORY_ICON, EvidenceBadge, Field, Icon } from './common';

const SEASON_ICON: Record<Season, string> = {
  winter: 'snow', spring: 'food', summer: 'sun', fall: 'leaf',
};

/** How much of the latest season shows before "Show the whole log". */
const LATEST_SHOWN = 4;

/**
 * Every system's log at once, season by season, newest first: what the
 * yard tried each season and how it went. The latest few entries show, so
 * the systems below stay in reach; the rest are a tap away. An entry opens
 * its system, where it is edited.
 */
export function YardTimelineCard() {
  const all = useYardLog((s) => s.entries);
  const design = useApp((s) => s.design);
  const inspect = useApp((s) => s.inspect);
  const southern = design.site.latitude < 0;
  const seasons = useMemo(() => logBySeason(all, southern), [all, southern]);
  const [whole, setWhole] = useState(false);
  const more = seasons.length > 1 || (seasons[0]?.entries.length ?? 0) > LATEST_SHOWN;
  const shown = whole || !more
    ? seasons
    : [{ ...seasons[0], entries: seasons[0].entries.slice(0, LATEST_SHOWN) }];

  return (
    <div className="card">
      <header>
        <h2>The yard, season by season</h2>
        <span className="sub">from the yard log</span>
      </header>

      {seasons.length === 0 ? (
        <p className="card-note">
          Nothing recorded yet. Open a system you have tried here and record what happened.
        </p>
      ) : (
        <div className="stack">
          {shown.map((season) => (
            <section key={season.key} className="stack" aria-label={season.label}>
              <div className="season-head">
                <span className="icon"><Icon name={season.season ? SEASON_ICON[season.season] : 'info'} size={16} /></span>
                <h3>{season.label}</h3>
                <span className="meta-line">
                  {season.entries.length} {season.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              {season.entries.map((e) => {
                const def = systemById(design, e.system);
                return (
                  <button
                    key={e.id} className="sys-row" disabled={!def}
                    onClick={() => def && inspect(def.id)}
                  >
                    <span className="icon"><Icon name={def ? CATEGORY_ICON[def.category] : 'info'} size={17} /></span>
                    <span className="grow">
                      <span className="row wrap" style={{ gap: 6 }}>
                        <span className="name grow">{def?.name ?? e.system}</span>
                        {e.result ? <EvidenceBadge tier={e.result} /> : <span className="meta-line">Note</span>}
                      </span>
                      <span className="meta-line">
                        {formatLogDate(e.date)}{e.private && ' · Private'}
                      </span>
                      {e.note && <span className="desc clamp-2">{e.note}</span>}
                    </span>
                    {e.photo && <img className="log-thumb" src={e.photo.thumb} alt="" loading="lazy" />}
                  </button>
                );
              })}
            </section>
          ))}
          {more && (
            <div className="row">
              <button className="btn small" onClick={() => setWhole((v) => !v)}>
                {whole ? 'Show less' : 'Show the whole log'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A system's yard log: what was tried here, when, and how it went. The
 * latest result is the system's tier, here and on the website.
 */
export function YardLogCard({ system }: { system: string }) {
  const all = useYardLog((s) => s.entries);
  const pending = useYardLog((s) => s.pending);
  const entries = useMemo(() => liveEntries(all, system).reverse(), [all, system]);
  const [editing, setEditing] = useState<LogEntry | 'new' | null>(null);

  return (
    <div className="card">
      <header>
        <h2>Yard log</h2>
        <span className="sub">what happened here</span>
      </header>

      {editing ? (
        <EntryForm
          system={system}
          entry={editing === 'new' ? null : editing}
          pending={editing !== 'new' && pending.includes(editing.id)}
          onDone={() => setEditing(null)}
        />
      ) : (
        <div className="stack">
          {entries.length === 0 ? (
            <>
              <p className="card-note">
                Nothing recorded yet. Once you have tried it here, record what happened,
                and especially when it didn't work.
              </p>
              <OtherYard system={system} />
            </>
          ) : (
            <ol className="log-list">
              {entries.map((e) => (
                <li key={e.id} className="log-entry">
                  <div className="row wrap" style={{ gap: 8 }}>
                    <span className="log-date">{formatLogDate(e.date)}</span>
                    {e.result ? <EvidenceBadge tier={e.result} /> : <span className="meta-line">Note</span>}
                    {e.private && <span className="meta-line" title="Kept off the website">Private</span>}
                    <span className="grow" />
                    <button className="btn small" onClick={() => setEditing(e)}>Edit</button>
                  </div>
                  {e.note && <p className="log-note">{e.note}</p>}
                  {e.photo ? (
                    <img className="log-photo" src={e.photo.thumb} alt="" loading="lazy" />
                  ) : pending.includes(e.id) && (
                    <LocalPhoto id={e.id} caption="Waiting to send" />
                  )}
                </li>
              ))}
            </ol>
          )}
          <div className="row">
            <button className="btn primary" onClick={() => setEditing('new')}>Record a result</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * What the Ann Arbor yard found, for a system this device has no entries
 * for: evidence from one real yard, set apart from the person's own log and
 * never their tier.
 */
function OtherYard({ system }: { system: string }) {
  const found = liveEntries(ANN_ARBOR_LOG, system).reverse();
  if (!found.length) return null;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="meta-line">
        One yard in Ann Arbor, Michigan, has tried this. What it found is evidence, not your result:
      </span>
      <ol className="log-list">
        {found.map((e) => (
          <li key={e.id} className="log-entry">
            <span className="log-date">
              {CHOICES.find((c) => c.value === e.result)?.label} there · {formatLogDate(e.date)}
            </span>
            {e.note && <p className="log-note">{e.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

const CHOICES: { value: LogResult | null; label: string }[] = [
  { value: 'testedSuccess', label: 'Worked' },
  { value: 'testedPartial', label: 'Partly worked' },
  { value: 'testedFailed', label: 'Didn’t work' },
  { value: null, label: 'Just a note' },
];

function EntryForm({
  system, entry, pending, onDone,
}: { system: string; entry: LogEntry | null; pending: boolean; onDone: () => void }) {
  const save = useYardLog((s) => s.save);
  const remove = useYardLog((s) => s.remove);

  const [result, setResult] = useState<LogResult | null | undefined>(entry ? entry.result : undefined);
  // A date input holds a whole day; a month-only date is kept unless one is picked.
  const [date, setDate] = useState(entry ? (entry.date.length === 10 ? entry.date : '') : localDate());
  const [note, setNote] = useState(entry?.note ?? '');
  const [hidden, setHidden] = useState(entry?.private ?? false);
  /** A new photo, null to remove the current one, undefined to keep it. */
  const [photo, setPhoto] = useState<Blob | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const keptDate = entry && entry.date.length !== 10 ? entry.date : '';
  const hasPhoto = photo ? true : photo === null ? false : !!entry?.photo || pending;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      setPhoto(await preparePhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That photo couldn’t be used.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async () => {
    if (result === undefined) return;
    setBusy(true);
    setError(null);
    try {
      await save({
        id: entry?.id, system, date: date || (entry ? keptDate : ''),
        result, note: note.trim(), private: hidden,
      }, photo);
      onDone();
    } catch {
      setError('This device couldn’t keep the photo. Free up some space, or save without it.');
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <Field label="What happened">
        <div className="row wrap">
          {CHOICES.map((c) => (
            <button
              key={c.label}
              type="button"
              className={`chip evidence-pick ${c.value ?? ''}`}
              aria-pressed={result === c.value}
              onClick={() => setResult(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="meta-line">
          {result === null
            ? 'A note leaves the result as it was.'
            : 'The latest result is this system’s status, here and on the website.'}
        </span>
      </Field>

      <Field label="When">
        <input type="date" value={date} max={localDate()} onChange={(e) => setDate(e.target.value)} />
        {keptDate && !date && (
          <span className="meta-line">Recorded as {formatLogDate(keptDate)}. Pick a day to make it exact.</span>
        )}
      </Field>

      <Field label="Note">
        <textarea
          rows={4}
          placeholder="What you did, what you saw, what you would change."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <div className="field">
        <label>Photo</label>
        {hasPhoto && (
          photo ? <BlobPhoto blob={photo} />
            : entry?.photo ? <img className="log-photo" src={entry.photo.thumb} alt="" />
              : entry && <LocalPhoto id={entry.id} caption="Waiting to send" />
        )}
        <div className="row wrap">
          <button type="button" className="btn small" disabled={busy} onClick={() => fileRef.current?.click()}>
            {hasPhoto ? 'Replace photo' : 'Add a photo'}
          </button>
          {hasPhoto && (
            <button type="button" className="btn small" disabled={busy} onClick={() => setPhoto(null)}>
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        <span className="meta-line">
          Sent without its location or any other details the camera stored.
        </span>
      </div>

      <label className="row" style={{ fontSize: 14, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        <span>
          Private
          <span className="meta-line" style={{ display: 'block' }}>
            Kept off the website. Its result still sets the status.
          </span>
        </span>
      </label>

      {error && <p className="card-note" role="alert" style={{ color: 'var(--status-critical)' }}>{error}</p>}

      <div className="row">
        <button className="btn primary" disabled={busy || result === undefined} onClick={() => void submit()}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="btn" disabled={busy} onClick={onDone}>Cancel</button>
        <span className="grow" />
        {entry && (
          <button
            className="btn small danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Delete this entry, here and on the website?')) {
                remove(entry.id);
                onDone();
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function BlobPhoto({ blob, caption }: { blob: Blob; caption?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return null;
  return (
    <figure className="log-figure">
      <img className="log-photo" src={url} alt="" />
      {caption && <figcaption className="meta-line">{caption}</figcaption>}
    </figure>
  );
}

/** A photo still on this device, waiting for the website. */
function LocalPhoto({ id, caption }: { id: string; caption: string }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  useEffect(() => {
    let live = true;
    void keptPhoto(id).then((b) => { if (live && b) setBlob(b); });
    return () => { live = false; };
  }, [id]);
  return blob ? <BlobPhoto blob={blob} caption={caption} /> : null;
}
