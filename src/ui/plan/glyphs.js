import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const G = {
    /* ---- water ---- */
    tank: _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "12", cy: "7", rx: "7", ry: "3" }), _jsx("path", { d: "M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" }), _jsx("path", { d: "M5 13c0 1.7 3.1 3 7 3s7-1.3 7-3" })] }),
    droplet: _jsx("path", { d: "M12 3s6 6.4 6 10.2A6 6 0 0 1 6 13.2C6 9.4 12 3 12 3z" }),
    gutter: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 8h18" }), _jsx("path", { d: "M3 8v3h18V8" }), _jsx("path", { d: "M8 11v6M16 11v9" })] }),
    funnel: _jsx(_Fragment, { children: _jsx("path", { d: "M4 4h16l-6 7v8l-4 2v-10z" }) }),
    waves: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 9q3-2.2 6 0t6 0 6 0" }), _jsx("path", { d: "M3 14q3-2.2 6 0t6 0 6 0" }), _jsx("path", { d: "M3 19q3-2.2 6 0t6 0 6 0" })] }),
    well: _jsxs(_Fragment, { children: [_jsx("path", { d: "M6 10h12v10H6z" }), _jsx("path", { d: "M4 10 12 4l8 6" }), _jsx("path", { d: "M12 10v10" })] }),
    contour: _jsxs(_Fragment, { children: [_jsx("path", { d: "M2 8q5-4 10 0t10 0" }), _jsx("path", { d: "M2 14q5-4 10 0t10 0" }), _jsx("path", { d: "M7 6v4M17 12v4" })] }),
    mist: _jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M4 10h16M4 14h16M4 18h16", strokeDasharray: "2 2.5" }) }),
    dripline: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 7h18" }), _jsx("path", { d: "M7 7v4M12 7v4M17 7v4" }), _jsx("circle", { cx: "7", cy: "14", r: "1.4" }), _jsx("circle", { cx: "12", cy: "14", r: "1.4" }), _jsx("circle", { cx: "17", cy: "14", r: "1.4" })] }),
    /* ---- energy ---- */
    panel: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 6h18l-2 10H5z" }), _jsx("path", { d: "M8 6l-1 10M16 6l1 10M4.4 11h15.2" }), _jsx("path", { d: "M12 16v4" })] }),
    battery: _jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "8", width: "16", height: "9", rx: "1.6" }), _jsx("path", { d: "M19 11h2v3h-2" }), _jsx("path", { d: "M7 11v3M11 11v3M15 11v3" })] }),
    collector: _jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "7", width: "18", height: "10", rx: "1.4" }), _jsx("path", { d: "M7 7v10M12 7v10M17 7v10" }), _jsx("circle", { cx: "19", cy: "4", r: "2" })] }),
    flame: _jsxs(_Fragment, { children: [_jsx("path", { d: "M12 3c3 4 5 5.6 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 .4 1.4 1 2 2 2 0-3-1-5 1-7z" }), _jsx("path", { d: "M5 21h14" })] }),
    coppice: _jsxs(_Fragment, { children: [_jsx("path", { d: "M6 21V9M12 21V5M18 21v-9" }), _jsx("path", { d: "M6 9 3 6M6 9l3-3M12 5 9 2M12 5l3-3M18 12l-3-3M18 12l3-3" })] }),
    turbine: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "9", r: "1.6" }), _jsx("path", { d: "M12 7.4V2M13.4 9.9l4.6 2.7M10.6 9.9 6 12.6" }), _jsx("path", { d: "M12 21v-9" })] }),
    digester: _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "12", cy: "14", rx: "8", ry: "6" }), _jsx("path", { d: "M12 8V4M10 4h4" }), _jsx("circle", { cx: "9", cy: "13", r: "1" }), _jsx("circle", { cx: "14", cy: "15", r: "1.3" })] }),
    dryer: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 16 12 6l9 10z" }), _jsx("path", { d: "M6.5 13h11" }), _jsx("path", { d: "M12 19v2" })] }),
    gasifier: _jsxs(_Fragment, { children: [_jsx("rect", { x: "6", y: "8", width: "10", height: "12", rx: "1.4" }), _jsx("path", { d: "M16 12h4v8" }), _jsx("path", { d: "M9 8V5M13 8V5" })] }),
    /* ---- food ---- */
    leaf: _jsxs(_Fragment, { children: [_jsx("path", { d: "M20 4c0 9-5.5 14-13 14 0-8 5-14 13-14z" }), _jsx("path", { d: "M4 20c4-4 8-7 12-9" })] }),
    tuber: _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "12", cy: "14", rx: "7", ry: "5" }), _jsx("circle", { cx: "9.5", cy: "13", r: ".9" }), _jsx("circle", { cx: "14", cy: "15.5", r: ".8" }), _jsx("path", { d: "M12 9V5M12 5l3-2M12 5 9 3.4" })] }),
    squash: _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "12", cy: "14", rx: "7.5", ry: "6" }), _jsx("path", { d: "M8.5 8.6v10.8M15.5 8.6v10.8" }), _jsx("path", { d: "M12 8V5" })] }),
    tree: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "9", r: "6" }), _jsx("path", { d: "M12 15v6M12 18l-3-2M12 17.5l3-2.2" })] }),
    berry: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "13", r: "3" }), _jsx("circle", { cx: "15", cy: "15", r: "2.6" }), _jsx("path", { d: "M8 10V6M15 12.4V8M6 6h4M13 8h4" })] }),
    hen: _jsxs(_Fragment, { children: [_jsx("path", { d: "M7 19c-2 0-4-1.8-4-4.4C3 11 6 9 9 9h4l3-3v3.4c2 .8 3 2.4 3 4.2 0 3-2.4 5.4-6 5.4z" }), _jsx("circle", { cx: "15.4", cy: "8.6", r: ".7", fill: "currentColor", stroke: "none" }), _jsx("path", { d: "M8 19v2M14 19v2" })] }),
    rabbit: _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "13", cy: "15", rx: "6", ry: "4.6" }), _jsx("path", { d: "M9 11 6.5 4.5M12 10.6 12.4 4" }), _jsx("circle", { cx: "17.6", cy: "14", r: ".7", fill: "currentColor", stroke: "none" })] }),
    duck: _jsxs(_Fragment, { children: [_jsx("path", { d: "M5 18c0-3.6 3-6.4 6.6-6.4h3.6V9a3 3 0 1 1 3 3v2c0 2.6-2.2 4.6-5 4.6z" }), _jsx("path", { d: "M20.4 10.4h2.4" })] }),
    bee: _jsxs(_Fragment, { children: [_jsx("path", { d: "M12 4 8 8.5h8z" }), _jsx("path", { d: "M6 10h12v5a6 6 0 0 1-12 0z" }), _jsx("path", { d: "M6 13h12M8 17h8" })] }),
    mushroom: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3.5 11a8.5 6 0 0 1 17 0z" }), _jsx("path", { d: "M9.5 11v6a2.5 2.5 0 0 0 5 0v-6" })] }),
    fish: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 12c3.6-4.4 9-6 13-4l4-2-1.4 5.4L20 17l-4-2c-4 2-9.4.4-13-3z" }), _jsx("circle", { cx: "8", cy: "10.6", r: ".8", fill: "currentColor", stroke: "none" })] }),
    tunnel: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 20V12a9 8 0 0 1 18 0v8z" }), _jsx("path", { d: "M8 20v-8.6M16 20v-8.6M3 15.4h18" })] }),
    tray: _jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "9", width: "18", height: "8", rx: "1.4" }), _jsx("path", { d: "M7 9V6M12 9V5M17 9V6" })] }),
    cellar: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 12 12 5l9 7" }), _jsx("path", { d: "M6 12v8h12v-8" }), _jsx("path", { d: "M10 20v-5h4v5" })] }),
    larva: _jsxs(_Fragment, { children: [_jsx("path", { d: "M4 14q2-3 4 0t4 0 4 0 4 0" }), _jsx("circle", { cx: "19.4", cy: "12.6", r: "1.4" })] }),
    duckweed: _jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "10", r: "2.6" }), _jsx("circle", { cx: "14.5", cy: "8.4", r: "2" }), _jsx("circle", { cx: "12", cy: "14", r: "2.8" }), _jsx("path", { d: "M3 19h18" })] }),
    /* ---- containers, supports, indoor ---- */
    growbag: _jsxs(_Fragment, { children: [_jsx("path", { d: "M6 8h12l-1.4 12H7.4z" }), _jsx("path", { d: "M6 8c0-1.2 2.7-2 6-2s6 .8 6 2" }), _jsx("path", { d: "M12 14v6M12 16l-2.4-2M12 17l2.4-2" })] }),
    pocket: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 4h18v4H3z" }), _jsx("path", { d: "M5 8v5a3 3 0 0 0 6 0V8M13 8v5a3 3 0 0 0 6 0V8" }), _jsx("path", { d: "M8 18v3M16 18v3" })] }),
    trellis: _jsxs(_Fragment, { children: [_jsx("path", { d: "M4 21V6M12 21V4M20 21V6" }), _jsx("path", { d: "M4 10h16M4 15h16" }), _jsx("path", { d: "M12 8c2 0 3-1.4 3-3-2 0-3 1.4-3 3z" })] }),
    bucketdrip: _jsxs(_Fragment, { children: [_jsx("path", { d: "M7 3h10l-1.2 8H8.2z" }), _jsx("path", { d: "M12 11v4" }), _jsx("path", { d: "M4 15h16" }), _jsx("path", { d: "M7 15v2M12 15v2M17 15v2" }), _jsx("circle", { cx: "7", cy: "20", r: "1.1" }), _jsx("circle", { cx: "12", cy: "20", r: "1.1" }), _jsx("circle", { cx: "17", cy: "20", r: "1.1" })] }),
    aerobin: _jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "6", width: "14", height: "15", rx: "1.6" }), _jsx("path", { d: "M8 6V4h8v2" }), _jsx("path", { d: "M12 9v9" }), _jsx("path", { d: "M12 11l-2.6-1.6M12 14l2.6-1.6M12 17l-2.6-1.6" })] }),
    raingarden: _jsxs(_Fragment, { children: [_jsx("path", { d: "M2 12q4-5 10-5t10 5" }), _jsx("path", { d: "M4 12q3 7 8 7t8-7" }), _jsx("path", { d: "M9 6V3M12 5.6V2M15 6V3", strokeDasharray: "1.5 1.6" })] }),
    tower: _jsxs(_Fragment, { children: [_jsx("path", { d: "M9 21h6" }), _jsx("path", { d: "M12 21V4" }), _jsx("path", { d: "M12 7c-3 0-4.5-1.6-4.5-4C10 3 12 4.4 12 7z" }), _jsx("path", { d: "M12 12c3 0 4.5-1.6 4.5-4C14 8 12 9.4 12 12z" }), _jsx("path", { d: "M12 17c-3 0-4.5-1.6-4.5-4C10 13 12 14.4 12 17z" }), _jsx("path", { d: "M4 3h3M17 3h3" })] }),
    recycler: _jsxs(_Fragment, { children: [_jsx("rect", { x: "4", y: "7", width: "16", height: "13", rx: "2" }), _jsx("path", { d: "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), _jsx("path", { d: "M9 12.5a3.2 3.2 0 0 1 5.6-1.6" }), _jsx("path", { d: "M14.6 9.4v1.8h-1.8" }), _jsx("path", { d: "M15 15a3.2 3.2 0 0 1-5.6 1.6" }), _jsx("path", { d: "M9.4 18v-1.8h1.8" })] }),
    flush: _jsxs(_Fragment, { children: [_jsx("path", { d: "M9 3h6v7l3 4v7H6v-7l3-4z" }), _jsx("path", { d: "M6 17h12" }), _jsx("circle", { cx: "12", cy: "20", r: "1.2" })] }),
    hangbag: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 3h18" }), _jsx("path", { d: "M9 3 8 7M15 3l1 4" }), _jsx("path", { d: "M7 7h10l-1.5 9h-7z" }), _jsx("path", { d: "M12 16v2.5" }), _jsx("path", { d: "M12 18.5c-2 0-3.2 1-3.5 2.5M12 18.5c2 0 3.2 1 3.5 2.5" })] }),
    pump: _jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "11", width: "8", height: "9", rx: "1.2" }), _jsx("path", { d: "M7 11V7h13" }), _jsx("path", { d: "M14 7v3M17 7v3M20 7v3" }), _jsx("circle", { cx: "7", cy: "15.5", r: "1.6" })] }),
    brew: _jsxs(_Fragment, { children: [_jsx("path", { d: "M5 9h14l-1.6 11H6.6z" }), _jsx("path", { d: "M12 9V4M10 4h4" }), _jsx("circle", { cx: "10", cy: "15", r: "1" }), _jsx("circle", { cx: "14", cy: "13", r: "1.2" }), _jsx("circle", { cx: "12.5", cy: "17.4", r: ".9" })] }),
    nettle: _jsxs(_Fragment, { children: [_jsx("path", { d: "M12 21V8" }), _jsx("path", { d: "M12 8C8.5 7.4 6.6 5 6.4 2.6 9.6 2.8 11.8 4.8 12 8z" }), _jsx("path", { d: "M12 14c3.5-.6 5.4-3 5.6-5.4-3.2.2-5.4 2.2-5.6 5.4z" }), _jsx("path", { d: "M8 5.4 7 6M10 7l-.8.8M16 11.4l1 .6M14 12.6l.9.7" })] }),
    jar: _jsxs(_Fragment, { children: [_jsx("path", { d: "M8 3h8v2.4l1.2 2.2V19a2 2 0 0 1-2 2H8.8a2 2 0 0 1-2-2V7.6L8 5.4z" }), _jsx("path", { d: "M8 5.4h8" }), _jsx("path", { d: "M9.6 17c2.2-.6 3.8-2.8 4.4-5.6" })] }),
    firepit: _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "12", cy: "17.5", rx: "8", ry: "3" }), _jsx("path", { d: "M12 14.6c-2.2-1.4-2.8-3.6-1.2-6.4.4 1.6 1.3 2.2 2.1 2.6.2-1.6 1-2.8 2-3.6.4 2.8 1.2 5-.9 7.4" })] }),
    jug: _jsxs(_Fragment, { children: [_jsx("path", { d: "M9 3h5v3l3 3v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3z" }), _jsx("path", { d: "M17 11h1.4a1.6 1.6 0 0 1 0 3.2H17" }), _jsx("path", { d: "M7 14h10" })] }),
    /* ---- sanitation / soil ---- */
    toilet: _jsxs(_Fragment, { children: [_jsx("path", { d: "M6 4h11l-1 7H7z" }), _jsx("path", { d: "M7 11c-1 4 0 6.6 5 9 5-2.4 6-5 5-9" })] }),
    bucket: _jsxs(_Fragment, { children: [_jsx("path", { d: "M5 8h14l-1.6 12H6.6z" }), _jsx("path", { d: "M8 8a4 4 0 0 1 8 0" })] }),
    drainfield: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 6h18M3 12h18M3 18h18" }), _jsx("path", { d: "M6 6v12M12 6v12M18 6v12", strokeDasharray: "2 2" })] }),
    compost: _jsxs(_Fragment, { children: [_jsx("path", { d: "M12 4a8 8 0 0 1 7.4 5" }), _jsx("path", { d: "M19.6 4.6 19.4 9l-4.4-.4" }), _jsx("path", { d: "M12 20a8 8 0 0 1-7.4-5" }), _jsx("path", { d: "M4.4 19.4 4.6 15l4.4.4" })] }),
    worm: _jsxs(_Fragment, { children: [_jsx("path", { d: "M5 16q2.4-4 4.8 0t4.8 0 4.8 0" }), _jsx("path", { d: "M5 16v2M19.4 16v2" })] }),
    comfrey: _jsxs(_Fragment, { children: [_jsx("path", { d: "M12 21V9" }), _jsx("path", { d: "M12 12c-4 0-6-2-6-5 3 0 6 1.6 6 5z" }), _jsx("path", { d: "M12 10c4 0 6-2 6-5-3 0-6 1.6-6 5z" })] }),
    covercrop: _jsxs(_Fragment, { children: [_jsx("path", { d: "M4 20c0-4 2-7 4-7M10 20c0-5 2-8 4-8M16 20c0-4 2-6 4-6" }), _jsx("path", { d: "M3 20h18" })] }),
    kiln: _jsxs(_Fragment, { children: [_jsx("path", { d: "M6 20 9 8h6l3 12z" }), _jsx("path", { d: "M10 8V5h4v3" }), _jsx("path", { d: "M8 15h8" })] }),
    /* ---- shelter ---- */
    greenhouse: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 20V11l9-6 9 6v9z" }), _jsx("path", { d: "M12 5v15M3 11h18M7.5 8.3v11.7M16.5 8.3v11.7" })] }),
    wall: _jsxs(_Fragment, { children: [_jsx("path", { d: "M4 4h16v16H4z" }), _jsx("path", { d: "M4 9.3h16M4 14.6h16M9.3 4v5.3M14.6 9.3v5.3M9.3 14.6V20" })] }),
    pergola: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 7h18" }), _jsx("path", { d: "M5 7v13M19 7v13" }), _jsx("path", { d: "M8 7v4M12 7v4M16 7v4" })] }),
    pond: _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 13q2.6-5 6-2.6t6-1.4 6 1.6" }), _jsx("path", { d: "M4 17q2.6-3.4 6-1.6t6-1 5 1" })] }),
};
/** Which mark each system uses. Unlisted ids fall back to the category mark. */
const BY_SYSTEM = {
    'roof-catchment': 'gutter',
    'poly-tank': 'tank',
    'ferrocement-cistern': 'tank',
    'swale-berm': 'contour',
    'greywater-branched-drain': 'dripline',
    'constructed-wetland': 'waves',
    'slow-sand-filter': 'funnel',
    'uv-ro-treatment': 'funnel',
    'drip-irrigation': 'dripline',
    'sheet-mulch': 'covercrop',
    'hand-well': 'well',
    'atmospheric-water': 'droplet',
    'fog-net': 'mist',
    'solar-pv': 'panel',
    'battery-bank': 'battery',
    'solar-thermal': 'collector',
    'rocket-mass-heater': 'flame',
    'coppice-woodlot': 'coppice',
    'solar-dehydrator': 'dryer',
    'biogas-digester': 'digester',
    'micro-wind': 'turbine',
    'micro-hydro': 'waves',
    'wood-gasifier': 'gasifier',
    'annual-beds': 'leaf',
    'staple-potato-bed': 'tuber',
    'winter-squash': 'squash',
    'biointensive-bed': 'leaf',
    'hugelkultur': 'coppice',
    'polytunnel': 'tunnel',
    'food-forest': 'tree',
    'fruit-trees': 'tree',
    'berry-hedge': 'berry',
    'laying-hens': 'hen',
    'meat-rabbits': 'rabbit',
    'ducks': 'duck',
    'beehive': 'bee',
    'mushroom-logs': 'mushroom',
    'aquaponics': 'fish',
    'root-cellar': 'cellar',
    'bsf-larvae': 'larva',
    'fodder-sprouts': 'tray',
    'duckweed-pond': 'duckweed',
    'felt-grow-bags': 'growbag',
    'felt-hanging-bags': 'pocket',
    'grow-trellis': 'trellis',
    'first-flush': 'flush',
    'chapin-bucket': 'bucketdrip',
    'aerobin': 'aerobin',
    'rain-garden': 'raingarden',
    'indoor-hydroponic-tower': 'tower',
    'biochar-tote': 'bucket',
    'food-recycler': 'recycler',
    'upside-down-planters': 'hangbag',
    'pump-drip-kit': 'pump',
    'worm-tea-brewer': 'brew',
    'nettle-patch': 'nettle',
    'banana-peel-tea': 'jar',
    'wood-ash': 'firepit',
    'urine-feed': 'jug',
    'composting-toilet': 'toilet',
    'humanure-system': 'bucket',
    'septic-leachfield': 'drainfield',
    'worm-flush-toilet': 'worm',
    'compost-bays': 'compost',
    'vermicompost': 'worm',
    'chop-and-drop': 'comfrey',
    'cover-crop': 'covercrop',
    'biochar-kiln': 'kiln',
    'bokashi': 'bucket',
    'attached-greenhouse': 'greenhouse',
    'thermal-mass-wall': 'wall',
    'shade-structure': 'pergola',
    'water-pond': 'pond',
};
const BY_CATEGORY = {
    water: 'droplet',
    food: 'leaf',
    energy: 'flame',
    sanitation: 'toilet',
    soil: 'compost',
    shelter: 'greenhouse',
};
export function glyphNameFor(def) {
    return BY_SYSTEM[def.id] ?? BY_CATEGORY[def.category];
}
/**
 * Draw a system's mark centred in a footprint of `w` × `h` metres.
 * `badge` puts a soft disc behind it, which the illustrated style wants and
 * the drafting style does not.
 */
export function PlanGlyph({ def, w, h, tone, hidden, badge, scale, }) {
    if (hidden)
        return null;
    const short = Math.min(w, h);
    // Below about a metre and a half the mark turns to mud; leave it out.
    if (short < 1.5)
        return null;
    // The canvas prints a name across the middle of anything this big, so the
    // mark steps into a corner rather than sitting under the text.
    const labelled = scale !== undefined && short * scale > 52;
    const size = Math.min(short * (labelled ? 0.34 : 0.52), labelled ? 1.9 : 2.6);
    const pad = size * 0.22;
    const x = labelled ? pad : (w - size) / 2;
    const y = labelled ? pad : (h - size) / 2;
    const paths = G[glyphNameFor(def)] ?? G.leaf;
    return (_jsxs("g", { transform: `translate(${x.toFixed(3)},${y.toFixed(3)}) scale(${(size / 24).toFixed(5)})`, children: [badge && _jsx("circle", { cx: "12", cy: "12", r: "11.5", fill: "var(--surface-1)", opacity: "0.6" }), _jsx("g", { fill: "none", stroke: tone, strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", opacity: "0.9", children: paths })] }));
}
/** Flat list of every mark, for the icon sheet in the catalog later. */
export const GLYPH_NAMES = Object.keys(G);
