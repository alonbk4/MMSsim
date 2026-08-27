/**
 * Solar geometry from latitude.
 *
 * Two things come out of here:
 *
 * 1. Clear-sky irradiation per month, which lets the site's sun figures track
 *    the latitude you actually live at instead of the one the climate preset
 *    was written for.
 * 2. The sun's track across the sky, which the plan draws as a real sun-path
 *    diagram rather than the schematic wash it had before.
 *
 * Formulae are the standard FAO-56 set (Allen et al., Irrigation and Drainage
 * Paper 56, ch. 3). They describe the top of the atmosphere: what reaches the
 * ground also depends on cloud, which is what the climate preset knows and
 * this file deliberately does not.
 */

const RAD = Math.PI / 180;
const SOLAR_CONSTANT = 0.0820; // MJ m⁻² min⁻¹
const MJ_PER_KWH = 3.6;

/** Mid-month day numbers, FAO-56 table 2.5. */
export const MID_MONTH_DAY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 350];

/** Solar declination in radians for a day of the year. */
export function declination(dayOfYear: number): number {
  return 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
}

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

/** Sunset hour angle in radians. Clamped, so polar day and night behave. */
export function sunsetHourAngle(latDeg: number, decl: number): number {
  const phi = latDeg * RAD;
  const x = -Math.tan(phi) * Math.tan(decl);
  if (x <= -1) return Math.PI;      // sun never sets
  if (x >= 1) return 0;             // sun never rises
  return Math.acos(x);
}

/** Extraterrestrial irradiation, kWh m⁻² day⁻¹, for a day of the year. */
export function clearSkyDaily(latDeg: number, dayOfYear: number): number {
  const phi = latDeg * RAD;
  const d = declination(dayOfYear);
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const ws = sunsetHourAngle(latDeg, d);
  const ra =
    ((24 * 60) / Math.PI) * SOLAR_CONSTANT * dr *
    (ws * Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.sin(ws));
  return Math.max(0, ra / MJ_PER_KWH);
}

/** The twelve monthly means, kWh m⁻² day⁻¹. */
export function clearSkyMonthly(latDeg: number): number[] {
  return MID_MONTH_DAY.map((d) => clearSkyDaily(latDeg, d));
}

/** Hours of daylight at the middle of each month. */
export function dayLengthMonthly(latDeg: number): number[] {
  return MID_MONTH_DAY.map((d) => (24 / Math.PI) * sunsetHourAngle(latDeg, declination(d)));
}

/**
 * How cloudy a place is, as the ratio of its actual sun-hours to the clear-sky
 * maximum at the latitude the preset describes. Carrying this across when the
 * user moves the latitude slider is what keeps "Mediterranean" meaning sunny
 * and "temperate oceanic" meaning grey.
 */
export function clearnessIndex(peakSunHours: number[], refLatitude: number): number {
  const clear = clearSkyMonthly(refLatitude);
  const actual = peakSunHours.reduce((a, b) => a + b, 0);
  const ideal = clear.reduce((a, b) => a + b, 0);
  return ideal > 0 ? actual / ideal : 0.5;
}

/** Sun-hours per day per month at a latitude, holding the climate's cloudiness. */
export function peakSunHoursAt(latDeg: number, clearness: number): number[] {
  return clearSkyMonthly(latDeg).map((c) => Math.max(0, c * clearness));
}

/* ---------------------------------------------------------------- */
/*  Sun path, for drawing                                            */
/* ---------------------------------------------------------------- */

export interface SunPoint {
  /** Degrees clockwise from north. */
  azimuth: number;
  /** Degrees above the horizon. */
  altitude: number;
}

/**
 * The sun's track on a given day, sampled from sunrise to sunset.
 * Returns an empty track on a polar night.
 */
export function sunTrack(latDeg: number, dayOfYear: number, samples = 25): SunPoint[] {
  const phi = latDeg * RAD;
  const d = declination(dayOfYear);
  const ws = sunsetHourAngle(latDeg, d);
  if (ws <= 0) return [];
  const out: SunPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const w = -ws + (2 * ws * i) / (samples - 1);
    const sinAlt = clamp1(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(w));
    const alt = Math.asin(sinAlt);
    const cosAz = clamp1(
      (Math.sin(d) - sinAlt * Math.sin(phi)) / (Math.cos(alt) * Math.cos(phi) || 1e-9),
    );
    // Azimuth is measured clockwise from north: the morning sun is east of
    // it (0–180°), the afternoon sun west of it (180–360°).
    const a = Math.acos(cosAz) / RAD;
    out.push({ azimuth: w < 0 ? a : 360 - a, altitude: alt / RAD });
  }
  return out;
}

/** Sun angle at solar noon, degrees above the horizon. */
export function noonAltitude(latDeg: number, dayOfYear: number): number {
  return 90 - Math.abs(latDeg - declination(dayOfYear) / RAD);
}

export const JUNE_SOLSTICE = 172;
export const DECEMBER_SOLSTICE = 355;
export const EQUINOX = 80;

/** Which solstice is this site's longest day. */
export function longestDay(latDeg: number): number {
  return latDeg >= 0 ? JUNE_SOLSTICE : DECEMBER_SOLSTICE;
}

export function shortestDay(latDeg: number): number {
  return latDeg >= 0 ? DECEMBER_SOLSTICE : JUNE_SOLSTICE;
}

/** A short human summary of what the latitude means for sun on the ground. */
export function sunSummary(latDeg: number): {
  summerNoon: number; winterNoon: number;
  summerDayLength: number; winterDayLength: number;
  polar: boolean;
} {
  const long = longestDay(latDeg);
  const short = shortestDay(latDeg);
  const dl = (day: number) => (24 / Math.PI) * sunsetHourAngle(latDeg, declination(day));
  return {
    summerNoon: noonAltitude(latDeg, long),
    winterNoon: noonAltitude(latDeg, short),
    summerDayLength: dl(long),
    winterDayLength: dl(short),
    polar: Math.abs(latDeg) > 66.5,
  };
}
