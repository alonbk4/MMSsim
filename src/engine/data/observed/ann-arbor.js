/**
 * Ann Arbor, Michigan — fifteen years of ERA5 reanalysis, fetched with
 * `tools/climate-fetch.html` on 2026-09-10.
 *
 * Worth knowing what this changed. The cold-continental preset the site used
 * before was written for 47°N and put January four degrees colder, October
 * nearly three degrees colder, and the year 215 mm drier than this ground
 * actually is. It also runs a 159 mm evaporative deficit across June to
 * August despite a wet-looking annual total, which is why a Michigan garden
 * still needs watering in July.
 *
 * Data © Open-Meteo, CC-BY-4.0, derived from ECMWF ERA5.
 */
export const ANN_ARBOR = {
    latitude: 42.27,
    longitude: -83.73,
    years: [2010, 2024],
    source: 'Open-Meteo ERA5 archive (CC-BY-4.0)',
    fetched: '2026-09-10',
    elevation: 270,
    timezone: 'America/Detroit',
    meanTempC: [-4, -3.3, 2.4, 8.2, 15.4, 20.5, 22.9, 21.8, 18.2, 11.7, 4.4, -0.2],
    rainfallMm: [60.2, 61, 72.1, 91.9, 94.3, 90.7, 90.1, 79.2, 74.9, 79.5, 60.3, 60.6],
    etoMm: [21.5, 29.4, 56.8, 82.9, 119.6, 143.2, 148.2, 127.9, 94.8, 64.5, 37.6, 22.7],
    peakSunHours: [1.72, 2.83, 3.91, 4.82, 5.72, 6.39, 6.23, 5.43, 4.26, 2.92, 1.98, 1.36],
};
