/**
 * Photos for the yard log, on this device until the website has them.
 *
 * A photo taken in the yard may be sent minutes or days later, from a phone
 * that was offline or closed in between, so it waits in IndexedDB: far
 * roomier than the few megabytes localStorage allows, and it keeps a Blob as
 * it is.
 */

const DB_NAME = 'mmssim';
const STORE = 'photos';

let opening: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!opening) {
    opening = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    // A failed open (private browsing, storage blocked) is tried again next time.
    opening.catch(() => { opening = null; });
  }
  return opening;
}

async function run<T>(mode: IDBTransactionMode, act: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const tx = (await db()).transaction(STORE, mode);
  const req = act(tx.objectStore(STORE));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function keepPhoto(entryId: string, photo: Blob): Promise<IDBValidKey> {
  return run('readwrite', (s) => s.put(photo, entryId));
}

export async function keptPhoto(entryId: string): Promise<Blob | undefined> {
  try {
    return await run<Blob | undefined>('readonly', (s) => s.get(entryId));
  } catch {
    return undefined;
  }
}

export async function forgetPhoto(entryId: string): Promise<void> {
  try {
    await run('readwrite', (s) => s.delete(entryId));
  } catch {
    // Nothing to forget, or no storage to forget it from.
  }
}

/**
 * A photo as it goes to the website: at most `maxSide` pixels on its long
 * side, turned the right way up, and re-encoded as a JPEG. Re-encoding
 * through a canvas carries over the pixels and nothing else, so where it was
 * taken (and the camera, and the time) stays behind.
 */
export async function preparePhoto(file: Blob, maxSide = 2000): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new Error('That photo couldn’t be read. Try a JPEG or PNG.');
    }
    // Browsers apply the camera's orientation flag when drawing an image,
    // and report its size the right way up.
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser can’t prepare photos.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('This browser can’t prepare photos.'))),
        'image/jpeg',
        0.85,
      ));
  } finally {
    URL.revokeObjectURL(url);
  }
}
