/**
 * Turning "where am I" into a latitude.
 *
 * Two ways in, both of which work with the aeroplane mode on: the device's own
 * position, and a bundled table of US ZIP centroids. There is deliberately no
 * call to a geocoding service — this app is meant to keep working in a shed at
 * the bottom of the garden, and a lookup that needs a network is a lookup that
 * fails exactly when you are standing in the yard.
 *
 * What a location buys you is the sun: latitude sets how high it climbs and how
 * long the day runs. It does *not* tell you your climate. Two places at 45°N
 * can be Portland or Ulaanbaatar, and no amount of coordinates settles which
 * without real weather data — so the climate preset stays the user's call.
 */
import { ZIP_CENTROIDS } from './data/zip-centroids';

export type LocationSource = 'manual' | 'zip' | 'device';

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  /** Latitude uncertainty in degrees — how much the answer could be out. */
  accuracyDeg: number;
  label: string;
  source: LocationSource;
}

/**
 * Look up a US ZIP. Falls back through shorter prefixes, so a ZIP that is not
 * in the table still lands in the right part of the country.
 */
export function lookupZip(raw: string): ResolvedLocation | null {
  const zip = raw.trim().replace(/[^0-9]/g, '').slice(0, 5);
  if (zip.length < 3) return null;

  for (let len = Math.min(5, zip.length); len >= 3; len--) {
    const hit = ZIP_CENTROIDS[zip.slice(0, len)];
    if (!hit) continue;
    const [latitude, longitude, spread] = hit;
    return {
      latitude,
      longitude,
      accuracyDeg: spread,
      label: `ZIP ${zip}`,
      source: 'zip',
    };
  }
  return null;
}

export function isPlausibleZip(raw: string): boolean {
  return /^\d{3,5}$/.test(raw.trim().replace(/[^0-9]/g, '').slice(0, 5));
}

/** Ask the device where it is. Rejects with a message fit to show a user. */
export function locateDevice(): Promise<ResolvedLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This device cannot report its position.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: Number(pos.coords.latitude.toFixed(3)),
        longitude: Number(pos.coords.longitude.toFixed(3)),
        // Horizontal accuracy is in metres; a degree of latitude is ~111 km.
        accuracyDeg: Math.max(0.01, (pos.coords.accuracy || 0) / 111000),
        label: formatCoords(pos.coords.latitude, pos.coords.longitude),
        source: 'device',
      }),
      (err) => reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission was declined. Enter a ZIP code or set the latitude by hand.'
          : err.code === err.POSITION_UNAVAILABLE
            ? 'The device could not get a fix. Enter a ZIP code instead.'
            : 'Locating timed out. Enter a ZIP code instead.',
      )),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  });
}

export function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

/**
 * Which presets are even possible at this latitude. Not a climate lookup —
 * just a way of putting the plausible options first and saying why the others
 * are unlikely, rather than pretending coordinates decide the weather.
 */
export function plausibleClimates(latitude: number): string[] {
  const abs = Math.abs(latitude);
  if (abs < 23.5) return ['tropicalWetDry', 'humidSubtropical', 'aridDesert'];
  if (abs < 35) return ['humidSubtropical', 'mediterranean', 'aridDesert', 'tropicalWetDry'];
  if (abs < 45) return ['mediterranean', 'humidSubtropical', 'temperateOceanic', 'coldContinental', 'aridDesert'];
  if (abs < 55) return ['temperateOceanic', 'coldContinental', 'mediterranean'];
  return ['coldContinental', 'temperateOceanic'];
}
