import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { applyLatitude, applySlope, buildDrivers, CLIMATE_PRESETS, getPreset, runoffFraction, siteFromPreset, solarLatitude, } from '../engine/climate';
import { formatCoords, isPlausibleZip, locateDevice, lookupZip, plausibleClimates, } from '../engine/location';
import { ClimateFetchError, fetchClimate } from '../engine/climateFetch';
import { findNormals } from '../engine/normals';
import { parseObservedClimate } from '../engine/observed';
import { sunSummary } from '../engine/solar';
import { useApp } from '../state/store';
import { ClimateChart, SunHoursChart } from './charts';
import { compact, Field, Icon } from './common';
import { WebsiteCard } from './WebsiteCard';
export function SitePane() {
    const site = useApp((s) => s.design.site);
    const setSite = useApp((s) => s.setSite);
    const drivers = buildDrivers(site);
    const preset = getPreset(site.climate);
    const num = (patch) => setSite(patch);
    return (_jsx("div", { className: "pane", children: _jsxs("div", { className: "pane-inner", children: [_jsxs("div", { className: "card", children: [_jsx("header", { children: _jsx("h2", { children: "The site" }) }), _jsxs("div", { className: "stack", children: [_jsx(Field, { label: "Name", children: _jsx("input", { type: "text", value: site.name, onChange: (e) => num({ name: e.target.value }) }) }), _jsx(SiteLocation, {}), _jsx(Field, { label: "Climate", children: _jsxs("select", { value: site.climate, onChange: (e) => {
                                            const p = CLIMATE_PRESETS.find((c) => c.id === e.target.value);
                                            if (p)
                                                setSite(siteFromPreset(p, site));
                                        }, children: [site.climateSource === 'observed' && (_jsxs("option", { value: "custom", children: ["Measured weather", site.climateYears ? ` — ${site.climateYears[0]}–${site.climateYears[1]}` : ''] })), CLIMATE_PRESETS.map((p) => {
                                                const likely = plausibleClimates(site.latitude).includes(p.id);
                                                return (_jsxs("option", { value: p.id, children: [p.label, likely ? '' : '  — unusual at this latitude'] }, p.id));
                                            })] }) }), site.climateSource === 'observed' ? (_jsxs("div", { className: "card-note", style: {
                                        border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px',
                                        background: 'var(--surface-2)',
                                    }, children: [_jsxs("strong", { style: { color: 'var(--success-text)' }, children: ["\u25CF ", site.climateLabel ?? 'Observed'] }), _jsxs("div", { style: { marginTop: 3 }, children: ["Running on measured weather for this ground rather than an archetype", site.climateProvenance ? ` — ${site.climateProvenance}` : '', ".", ' ', Math.round(site.annualRainfallMm), " mm of rain a year."] }), _jsx("div", { className: "meta-line", style: { marginTop: 5 }, children: "Choosing a climate above replaces it with a generic one." })] })) : (_jsx("p", { className: "card-note", children: preset.blurb })), _jsx(ClimateSources, {})] })] }), _jsxs("div", { className: "card", children: [_jsxs("header", { children: [_jsx("h2", { children: "The sun here" }), _jsx("span", { className: "sub", children: "latitude sets the sun" })] }), _jsx(LatitudeControl, {})] }), _jsxs("div", { className: "card", children: [_jsxs("header", { children: [_jsx("h2", { children: "Water in, water out" }), _jsx("span", { className: "sub", children: "millimetres per month" })] }), _jsx(ClimateChart, { rainfall: drivers.rainfallMm, eto: site.etoMm }), _jsx("p", { className: "card-note", style: { marginTop: 8 }, children: "Where the orange line sits above the bars, plants are living on stored water \u2014 yours or the soil's. That gap is what storage and mulch are for." })] }), _jsxs("div", { className: "card", children: [_jsx("header", { children: _jsx("h2", { children: "Ground & roof" }) }), _jsxs("div", { className: "stack", children: [_jsx(Slider, { label: "Usable yard area", value: site.lotAreaM2, min: 20, max: 5000, step: 10, suffix: "m\u00B2", onChange: (v) => num({ lotAreaM2: v }) }), _jsx(Slider, { label: "Yard width", value: site.lotWidthM, min: 4, max: 120, step: 1, suffix: "m", onChange: (v) => num({ lotWidthM: v }), hint: `${Math.round(site.lotAreaM2 / Math.max(4, site.lotWidthM))} m deep` }), _jsx(Slider, { label: "Roof area", value: site.roofAreaM2, min: 0, max: 600, step: 5, suffix: "m\u00B2", onChange: (v) => num({ roofAreaM2: v }), hint: "Catchment and panels compete for this" }), _jsx(Slider, { label: "House height", value: site.houseHeightM, min: 0, max: 20, step: 0.5, suffix: "m", onChange: (v) => num({ houseHeightM: v }), hint: "It is the biggest shadow on most plots" }), _jsx(Field, { label: "Soil", children: _jsxs("select", { value: site.soil, onChange: (e) => num({ soil: e.target.value }), children: [_jsx("option", { value: "sand", children: "Sand \u2014 drains fast, holds little" }), _jsx("option", { value: "loam", children: "Loam \u2014 the easy case" }), _jsx("option", { value: "clay", children: "Clay \u2014 holds water, waterlogs" })] }) }), _jsx(Slider, { label: "Annual rainfall", value: site.annualRainfallMm, min: 50, max: 3000, step: 10, suffix: "mm", onChange: (v) => num({ annualRainfallMm: v }), hint: `${compact(site.annualRainfallMm * site.roofAreaM2 * 0.85)} L/yr off the whole roof` })] })] }), _jsxs("div", { className: "card", children: [_jsxs("header", { children: [_jsx("h2", { children: "Which way the ground falls" }), _jsx("span", { className: "sub", children: "slope changes sun and water" })] }), _jsx(SlopeControl, {})] }), _jsxs("div", { className: "card", children: [_jsx("header", { children: _jsx("h2", { children: "The household" }) }), _jsxs("div", { className: "stack", children: [_jsx(Slider, { label: "People", value: site.household, min: 1, max: 12, step: 1, suffix: "", onChange: (v) => num({ household: v }) }), _jsx(Slider, { label: "Water use", value: site.waterUsePerPersonLPerDay, min: 20, max: 400, step: 5, suffix: "L/person/day", onChange: (v) => num({ waterUsePerPersonLPerDay: v }), hint: `${compact(site.waterUsePerPersonLPerDay * site.household * 365)} L/yr for the household` }), _jsx(Slider, { label: "Electricity", value: site.electricityPerPersonKwhPerDay, min: 0.5, max: 20, step: 0.5, suffix: "kWh/person/day", onChange: (v) => num({ electricityPerPersonKwhPerDay: v }) }), _jsx(Slider, { label: "Food energy", value: site.caloriesPerPersonPerDay, min: 1200, max: 4000, step: 50, suffix: "kcal/person/day", onChange: (v) => num({ caloriesPerPersonPerDay: v }) }), _jsx(Slider, { label: "Protein", value: site.proteinPerPersonKgPerMonth, min: 0.5, max: 5, step: 0.1, suffix: "kg/person/month", onChange: (v) => num({ proteinPerPersonKgPerMonth: v }) }), _jsx(Slider, { label: "Greywater recovered", value: Math.round(site.greywaterFraction * 100), min: 0, max: 90, step: 5, suffix: "% of use", onChange: (v) => num({ greywaterFraction: v / 100 }), hint: "Shower, bath, laundry and sink \u2014 not the toilet" })] })] }), _jsx(WebsiteCard, {}), _jsx("p", { className: "card-note", children: "These presets are a starting point, not your site. Every one of them is worth replacing with a number you have measured \u2014 a rain gauge and a year is the cheapest instrument in this whole app." })] }) }));
}
/**
 * Finding the site, and with it the weather, without a network.
 *
 * Both routes work offline: the device's own fix, and a bundled table of US ZIP
 * centroids. Deliberately no geocoding service — this is meant to keep working
 * in a shed at the bottom of the garden, which is where you would actually be
 * standing when you wanted it. Once located, the site takes a saved record for
 * the same ground if there is one, else the built-in averages for that grid
 * cell (US only), else keeps the climate it had and says so.
 */
function SiteLocation() {
    const site = useApp((s) => s.design.site);
    const adoptLocation = useApp((s) => s.adoptLocation);
    const [outcome, setOutcome] = useState(null);
    const adopt = async (loc) => {
        let normals = null;
        try {
            normals = await findNormals(loc.latitude, loc.longitude);
        }
        catch {
            // The table is a separate chunk; offline before it was ever cached, it
            // is simply not there, and the location still counts.
        }
        setOutcome(adoptLocation(loc, normals));
    };
    return (_jsxs(Field, { label: "Where", children: [_jsx(LocationFinder, { onFound: adopt }), site.locationLabel && (_jsxs("p", { className: "meta-line", children: ["Set from ", site.locationLabel, site.locationSource === 'zip' && site.locationAccuracyDeg !== undefined
                        && ` — good to about ${site.locationAccuracyDeg.toFixed(1)}° of latitude`, site.locationSource === 'device' && ' — reported by this device', site.longitude !== undefined && ` · ${formatCoords(site.latitude, site.longitude)}`] })), outcome && _jsx(WeatherOutcome, { outcome: outcome })] }));
}
function WeatherOutcome({ outcome }) {
    if (outcome.kind === 'saved') {
        return (_jsxs("p", { className: "meta-line", style: { color: 'var(--success-text)' }, children: ["Weather: your saved record for ", outcome.record.name, outcome.km >= 1 ? `, ${outcome.km.toFixed(0)} km away` : '', " \u2014 measured beats typical."] }));
    }
    if (outcome.kind === 'normals') {
        const { climate, gridOffsetKm } = outcome.hit;
        return (_jsxs("p", { className: "meta-line", style: { color: 'var(--success-text)' }, children: ["Weather: built-in averages for ", climate.years[0], "\u2013", climate.years[1], ", from a grid cell ", gridOffsetKm < 1 ? 'right here' : `${gridOffsetKm.toFixed(0)} km away`, ". No network needed. Fetching below gets fifteen years on a finer grid."] }));
    }
    return (_jsx("p", { className: "meta-line", children: "No built-in weather this far from a US ZIP, so the climate below is unchanged \u2014 pick the closest one, or fetch measured weather for this point." }));
}
/**
 * Where the weather comes from: fetch it for the current coordinates, switch
 * between records already kept, or paste one in from the offline tool.
 */
function ClimateSources() {
    const design = useApp((s) => s.design);
    const site = design.site;
    const saveClimate = useApp((s) => s.saveClimate);
    const useClimateRecord = useApp((s) => s.useClimate);
    const removeClimate = useApp((s) => s.removeClimate);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState(null);
    const [error, setError] = useState(null);
    const label = site.locationLabel
        ?? (site.longitude !== undefined ? formatCoords(site.latitude, site.longitude) : null);
    const fetchHere = async () => {
        if (site.longitude === undefined) {
            setError('Set a location first — a ZIP code, or Use my location below.');
            return;
        }
        setBusy(true);
        setError(null);
        setNote(null);
        try {
            const { climate, gridOffsetKm } = await fetchClimate(site.latitude, site.longitude);
            saveClimate(climate, label ?? formatCoords(site.latitude, site.longitude));
            setNote(`Loaded ${climate.years[0]}–${climate.years[1]}. `
                + `The nearest grid cell is ${gridOffsetKm < 1 ? 'under a kilometre' : `${gridOffsetKm.toFixed(0)} km`} `
                + 'from the point you gave, which is the resolution of the weather, not of your yard.');
        }
        catch (e) {
            setError(e instanceof ClimateFetchError ? e.message
                : 'Something went wrong fetching the weather.');
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("div", { className: "stack", style: { gap: 8 }, children: [_jsxs("div", { className: "row wrap", style: { gap: 8 }, children: [_jsx("button", { className: "btn small", onClick: fetchHere, disabled: busy, children: busy ? 'Fetching 15 years…' : `Fetch measured weather for ${label ?? 'this location'}` }), _jsx(ClimateImport, {})] }), note && _jsx("p", { className: "meta-line", style: { color: 'var(--success-text)' }, children: note }), error && _jsx("p", { className: "meta-line", style: { color: 'var(--status-critical)' }, children: error }), design.climates.length > 0 && (_jsxs("div", { className: "stack", style: { gap: 5 }, children: [_jsx("span", { className: "meta-line", children: "Saved locations" }), design.climates.map((c) => {
                        const active = site.climateSource === 'observed'
                            && Math.abs(site.latitude - c.latitude) < 0.001
                            && Math.abs((site.longitude ?? 999) - c.longitude) < 0.001;
                        return (_jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsxs("button", { className: "chip", "aria-pressed": active, style: { flex: '1 1 auto', textAlign: 'left' }, onClick: () => useClimateRecord(c.id), children: [c.name, _jsxs("span", { style: { opacity: 0.7 }, children: [' · ', Math.round(c.rainfallMm.reduce((a, b) => a + b, 0)), " mm", ' · ', c.years[0], "\u2013", c.years[1]] })] }), design.climates.length > 1 && (_jsx("button", { className: "btn small danger", "aria-label": `Remove ${c.name}`, onClick: () => removeClimate(c.id), children: _jsx(Icon, { name: "trash", size: 13 }) }))] }, c.id));
                    })] }))] }));
}
function ClimateImport() {
    const saveClimate = useApp((s) => s.saveClimate);
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [error, setError] = useState(null);
    const load = () => {
        const parsed = parseObservedClimate(text);
        if ('error' in parsed) {
            setError(parsed.error);
            return;
        }
        saveClimate(parsed, formatCoords(parsed.latitude, parsed.longitude));
        setError(null);
        setText('');
        setOpen(false);
    };
    if (!open) {
        return (_jsx("button", { className: "btn small", onClick: () => setOpen(true), children: "Paste from the offline tool" }));
    }
    return (_jsxs("div", { className: "stack", style: { gap: 8, flexBasis: '100%' }, children: [_jsxs("p", { className: "card-note", style: { marginBottom: 0 }, children: ["Open ", _jsx("code", { children: "tools/climate-fetch.html" }), " from the repository in a browser, enter your coordinates, and paste what it produces here. Fifteen years of reanalysis, averaged into the twelve numbers this model reads."] }), _jsx("textarea", { rows: 5, placeholder: '{ "mmssimClimate": 1, \u2026 }', value: text, onChange: (e) => { setText(e.target.value); setError(null); } }), error && _jsx("p", { className: "meta-line", style: { color: 'var(--status-critical)' }, children: error }), _jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsx("button", { className: "btn small primary", onClick: load, disabled: !text.trim(), children: "Use this weather" }), _jsx("button", { className: "btn small", onClick: () => { setOpen(false); setError(null); }, children: "Cancel" })] })] }));
}
function LocationFinder({ onFound }) {
    const [zip, setZip] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const useDevice = async () => {
        setBusy(true);
        setError(null);
        try {
            onFound(await locateDevice());
            setZip('');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Could not get a position.');
        }
        finally {
            setBusy(false);
        }
    };
    const useZip = () => {
        const hit = lookupZip(zip);
        if (!hit) {
            setError('No match for that ZIP. Check the digits, or set the latitude by hand below.');
            return;
        }
        setError(null);
        onFound(hit);
    };
    return (_jsxs("div", { className: "stack", style: { gap: 8 }, children: [_jsxs("div", { className: "row wrap", style: { gap: 8 }, children: [_jsx("button", { className: "btn", onClick: useDevice, disabled: busy, children: busy ? 'Locating…' : 'Use my location' }), _jsxs("span", { className: "row", style: { gap: 6, flex: '1 1 190px' }, children: [_jsx("input", { type: "text", inputMode: "numeric", placeholder: "US ZIP code", value: zip, onChange: (e) => { setZip(e.target.value); setError(null); }, onKeyDown: (e) => { if (e.key === 'Enter')
                                    useZip(); }, "aria-label": "US ZIP code" }), _jsx("button", { className: "btn", onClick: useZip, disabled: !isPlausibleZip(zip), children: "Find" })] })] }), error && (_jsx("p", { className: "meta-line", style: { color: 'var(--status-critical)' }, children: error })), _jsx("p", { className: "meta-line", children: "Places the sun, and in the US sets typical weather from a built-in table \u2014 no network needed. Elsewhere, pick the closest climate below or fetch." })] }));
}
function SlopeControl() {
    const site = useApp((s) => s.design.site);
    const setSite = useApp((s) => s.setSite);
    const effective = solarLatitude(site);
    const runoff = runoffFraction(site);
    const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(site.slopeAspect / 45) % 8];
    const shift = effective - site.latitude;
    return (_jsxs("div", { className: "stack", children: [_jsxs(Field, { label: "Steepness", value: `${site.slopePercent}%`, children: [_jsx("input", { type: "range", min: 0, max: 45, step: 1, value: site.slopePercent, onChange: (e) => setSite(applySlope(site, Number(e.target.value), site.slopeAspect)) }), _jsx("span", { className: "meta-line", children: site.slopePercent === 0
                            ? 'Flat.'
                            : `Falls ${site.slopePercent} m over every 100 m — about ${Math.round(Math.atan(site.slopePercent / 100) * 180 / Math.PI)}°.` })] }), _jsxs(Field, { label: "Falls towards", value: `${compass} · ${Math.round(site.slopeAspect)}°`, children: [_jsx("input", { type: "range", min: 0, max: 355, step: 5, value: site.slopeAspect, onChange: (e) => setSite(applySlope(site, site.slopePercent, Number(e.target.value))) }), _jsx("span", { className: "meta-line", children: "Downhill direction, clockwise from north." })] }), _jsxs("div", { className: "tiles", children: [_jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: "Sun behaves like" }), _jsxs("div", { className: "figure", children: [Math.abs(effective).toFixed(1), "\u00B0"] }), _jsx("div", { className: "range", children: Math.abs(shift) < 0.1
                                    ? 'same as flat ground'
                                    : `${Math.abs(shift).toFixed(1)}° ${shift * (site.latitude >= 0 ? 1 : -1) < 0 ? 'nearer' : 'further from'} the equator` })] }), _jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: "Rain that runs off" }), _jsxs("div", { className: "figure", children: [Math.round(runoff * 100), "%"] }), _jsx("div", { className: "range", children: "the rest soaks in where it lands" })] })] }), _jsx("p", { className: "card-note", style: { marginBottom: 0 }, children: "A slope leaning towards the equator gathers light as though it were that much closer to it, and one leaning away loses the same. Steepness also decides how much rain leaves before it can soak in, which raises irrigation demand and is exactly what a swale is built to catch \u2014 so the same swale is worth far more here on steep clay than on flat sand." })] }));
}
function LatitudeControl() {
    const site = useApp((s) => s.design.site);
    const setSite = useApp((s) => s.setSite);
    const sun = sunSummary(site.latitude);
    const hemisphere = site.latitude < 0 ? 'S' : 'N';
    const move = (lat) => setSite({
        ...applyLatitude(site, lat),
        locationSource: 'manual',
        locationLabel: undefined,
        locationAccuracyDeg: undefined,
    });
    return (_jsxs("div", { className: "stack", children: [_jsxs(Field, { label: "Latitude", value: `${Math.abs(site.latitude).toFixed(1)}° ${hemisphere}`, children: [_jsx("input", { type: "range", min: -66, max: 66, step: 0.5, value: site.latitude, onChange: (e) => move(Number(e.target.value)) }), _jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsx("input", { type: "number", min: -66, max: 66, step: 0.1, value: Number(site.latitude.toFixed(1)), onChange: (e) => move(Number(e.target.value)), style: { maxWidth: 110 } }), _jsx("span", { className: "meta-line", children: "negative is south of the equator" })] })] }), _jsxs("div", { className: "tiles", children: [_jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: "Midsummer sun" }), _jsxs("div", { className: "figure", children: [Math.round(sun.summerNoon), "\u00B0"] }), _jsxs("div", { className: "range", children: [sun.summerDayLength.toFixed(1), " h of daylight"] })] }), _jsxs("div", { className: "tile", children: [_jsx("div", { className: "label", children: "Midwinter sun" }), _jsxs("div", { className: "figure", children: [Math.round(Math.max(0, sun.winterNoon)), "\u00B0"] }), _jsx("div", { className: "range", children: sun.winterNoon <= 0
                                    ? 'sun stays below the horizon'
                                    : `${sun.winterDayLength.toFixed(1)} h of daylight` })] })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 550 }, children: "Usable sun, hours per day" }), _jsx(SunHoursChart, { hours: site.peakSunHours })] }), _jsx("p", { className: "card-note", style: { marginBottom: 0 }, children: "The weather says how cloudy a place is; latitude says how much sun there is to be blocked, how high it climbs and how long the day runs. Move this and the sun figures \u2014 and everything that depends on them, panels included \u2014 recompute from geometry. It is a what-if: the ZIP or location above is what sets where you are. Crossing the equator flips the seasons." })] }));
}
function Slider({ label, value, min, max, step, suffix, hint, onChange, }) {
    return (_jsxs(Field, { label: label, value: `${value % 1 === 0 ? value : value.toFixed(1)} ${suffix}`.trim(), children: [_jsx("input", { type: "range", min: min, max: max, step: step, value: value, onChange: (e) => onChange(Number(e.target.value)) }), hint && _jsx("span", { className: "meta-line", children: hint })] }));
}
