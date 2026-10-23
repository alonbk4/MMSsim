import { describe, expect, it } from 'vitest';
import starter from '../../wordpress/plugin/yard-systems/starter/content.php?raw';
import updates from '../../wordpress/plugin/yard-systems/includes/updates.php?raw';
import { CATALOG_BY_ID } from './catalog';

/**
 * The website follows simulator systems by id: each of its systems names the
 * ones whose results it shows. Renaming or removing a simulator system would
 * leave a page that quietly stops updating, so the ids are read here from
 * the plugin itself, from both places it records them — the starter content
 * a new site is built from, and the updates an existing site is brought
 * forward with — and every one must still exist.
 */
function followedIds(): Map<string, string> {
  const found = new Map<string, string>();
  const read = (src: string, file: string, pattern: RegExp) => {
    for (const m of src.matchAll(pattern)) {
      for (const id of m[1].split(/\s+/).filter(Boolean)) found.set(id, file);
    }
  };
  read(starter, 'starter/content.php', /'sim'\s*=>\s*'([^']*)'/g);
  read(updates, 'includes/updates.php', /'ys_sim_id',\s*'([^']*)'/g);
  return found;
}

describe('the systems the website follows', () => {
  const followed = followedIds();

  it('are found in the plugin at all', () => {
    // If the plugin changes how it records them, this should fail loudly
    // rather than check nothing.
    expect(followed.size).toBeGreaterThan(10);
    expect(followed.has('aerobin')).toBe(true);
  });

  it('all still exist in the catalog', () => {
    const missing = [...followed].filter(([id]) => !CATALOG_BY_ID[id]).map(([id, file]) => `${id} (${file})`);
    expect(missing).toEqual([]);
  });
});
