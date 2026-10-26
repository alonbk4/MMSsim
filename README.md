# MMSsim — Yard Systems Simulator

Design the off-grid water, food, energy, fertility and sanitation systems for a
real piece of ground, and find out whether they actually balance across a year.

Drag systems onto a plan of your yard, set the climate and household, and the
simulator runs twelve months of resource flows: what each system produces, what
it needs to run, what carries over in storage, and where the design comes up
short. Costs, labour hours, ground area and roof area are tallied as you go.

The thing that makes it different from a catalog of good ideas: **every system
carries an evidence tier**, and the results are reported as a range across those
tiers.

| Tier | Meaning | Counted at |
|---|---|---|
| **Unproven** | Speculative, contested, or so site-dependent a yard-scale figure means little. | ×1 (×0.25–1.6) |
| **Researched** | Documented somewhere else, credible, not tried here. | ×1 (×0.65–1.35) |
| **Tested — did not work** | You built it here and it failed. | ×0.05 (×0–0.15) |
| **Tested — partly worked** | You built it here and it underperformed, or worked only some years. | ×0.65 (×0.35–0.9) |
| **Tested — works** | Built and measured here, doing what it should. | ×1 (×0.9–1.1) |

Least certain first, so a row of them reads left to right from "somebody wrote
this down somewhere" to "I watched it happen in my own garden".

The three tested tiers are the point. A yard produces two kinds of knowledge
and only one of them ever gets written down — recording that something *failed*
is worth as much as recording that it worked. It stops you spending another
spring on it, and it is the one fact no book about somebody else's garden can
give you. A failed system stays on the plan, drained of colour, producing
almost nothing while still charged for the money, the labour and the ground it
took, because that is what happened.

The tier moves the headline figure, not just the error bars: mark a bed as
having half worked and its July output drops from 5.6k kcal to 3.7k. If you
know *how far* short it fell, mark it as working and enter the measured number
instead — the partial tier is for when you know it disappointed but not by how
much.

Nothing in the catalog ships in a tested tier — those mean *you* built it,
which no catalog entry can claim for you. A tested tier comes only from the
yard log (Catalog → a system → Yard log): dated entries, each with a result,
a note and maybe a photo, and a system's tier is its latest result. The log
starts empty on every new device: what one yard found is not your result.
For a system you have not logged, the app shows what the Ann Arbor yard this
was built for found (`ANN_ARBOR_LOG` in `src/engine/yardLog.ts`), set apart
as evidence: the Aerobin, the biochar (made, then charged in a tote) and the
aquaponics system worked there; the nettle ferment and the banana peel tea,
one moulded batch and one good one each, partly worked. So the app tells you not just "this design covers 88% of your
irrigation" but "…and only 58% if the researched and unproven parts come in at
the bottom of their range." As you build things here, record what happened; the
bands narrow and the answers stop being a literature review.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 22 engine tests
npm run build      # production build into dist/
npm run preview    # serve the built app
```

React 19 + TypeScript + Vite. State in Zustand, persisted to `localStorage`.
Charts are hand-rolled SVG — no charting dependency.

### Deploying it

`main` is the live site. `.github/workflows/pages.yml` builds and publishes
`dist/` on every push to `main`, and nothing else deploys. Work happens on
other branches, where `.github/workflows/ci.yml` runs the same tests and build
without publishing; a change goes live when it is merged into `main`, so a
broken build stops at the branch instead of reaching the phone in your pocket.

Two repository settings go with this:

> Settings → General → Default branch → **main**
>
> Settings → Environments → github-pages → Deployment branches → allow **main**

The second matters because Pages restricts which branches may deploy, and the
list was made when a different branch was the default.

The workflow only takes effect once Pages is pointed at it:

> Settings → Pages → Build and deployment → **Source: GitHub Actions**

Deploying "from a branch" instead serves the repository root, which contains the
development `index.html` — its script tag points at `/src/main.tsx`, a file that
only exists before the build. The browser gets a 404 for it and renders a blank
page, which is the usual explanation for a Pages deploy that shows nothing.

Leaving the source on a branch while this workflow also deploys is worse than
either alone. GitHub's own "pages build and deployment" then runs on every push
to that branch alongside the workflow, both publish, and whichever finishes
last is what is live — the app on some pushes, a white page on others. That was
the intermittent white page through October 2026. If that run shows up in the
Actions tab again, the source has been switched back.

`base: './'` in `vite.config.ts` keeps every asset path relative, so the same
build works at a user site (`you.github.io`), at a project subpath
(`you.github.io/MMSsim/`) and inside a Capacitor WebView, with no rebuild.

### Installing it on a phone

It ships as a PWA: open the built site on a phone and use *Add to Home Screen*.
It then launches full-screen, keeps working offline (Workbox precaches the whole
bundle), and stores your design on the device.

### Native iOS / Android later

Nothing in the codebase assumes a browser tab. When you want App Store and Play
Store builds, Capacitor wraps this exact bundle with no rewrite:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init MMSsim app.mmssim --web-dir=dist
npx cap add ios && npx cap add android
npm run build && npx cap sync
```

`base: './'` in `vite.config.ts` is already set for the `capacitor://` origin,
touch and pointer events are used throughout (no mouse-only interactions), and
layout respects `env(safe-area-inset-*)`. Storage is `localStorage`, which
Capacitor's WebView provides on both platforms.

## How the model works

**Twelve months, run twice.** The engine simulates 24 months and keeps the last
12, so tanks and cellars settle into a self-consistent state instead of
reflecting whatever you guessed for their starting level.

**Systems declare flows, not results.** Each catalog entry lists what it
produces and consumes, in one of three shapes:

- `constant` — a flat amount per unit per month
- `annual` — a yearly figure spread by a seasonal profile (flat, growing season,
  summer-weighted, winter-weighted)
- `driver` — multiplied by a climate series derived from the site

The drivers are rainfall, peak sun hours, growing-season share, irrigation
demand and heating degree days. That is why a solar array in the arid preset
outproduces the same array in the oceanic one, and why a bed in a cold
continental climate concentrates its whole yield into four months.

**Real weather, not an archetype.** A climate preset is a shape borrowed from
somewhere that resembles you. `tools/climate-fetch.html` is a single local page
that pulls fifteen years of daily ERA5 reanalysis for one point and averages it
into the twelve monthly numbers the model reads — temperature, rainfall,
evaporative demand and sun hours. Paste the result into the Site tab and the
site runs on measured ground, with the source and the years recorded alongside
it, exactly the way a system carries its evidence tier.

The app ships with Ann Arbor, Michigan loaded that way. It is instructive about
what presets cost you: the cold-continental archetype it replaced was written
for 47°N and had January four degrees too cold, October nearly three degrees
too cold, and the year 215 mm too dry. It also missed a 159 mm evaporative
deficit from June to August, which is the reason a Michigan garden still needs
watering in July despite a wet-looking annual total.

The app can also fetch for itself: set a location, press **Fetch measured
weather for …** (the button names the point it will use), and it pulls and
averages the same fifteen years. The offline
tool remains, both as the no-network path and because it is where the response
shape was confirmed in the first place. Records are kept in a small library, so
a design can be compared against another town — the question "what would this
do forty miles east" has an answer now.

Reanalysis is gridded, so a record covers a cell rather than an address. Both
routes report how far the cell sits from the point you named: every ZIP in a
town will usually return the same weather, and what varies *inside* the town —
frost pockets, the shade of a neighbour's conifer, a valley that holds cold air
— is what the zones and the shade model are for. Moving the latitude or tilting
the ground afterwards
*scales* the measured series rather than replacing it, so real cloud
seasonality survives: Ann Arbor's July dips below its June, and it still does
after you move the site to 55°N.

**Finding the site.** Enter a US ZIP code or tap *Use my location* and the
latitude is set for you. Both routes work with no network: the device's own fix,
and a bundled table of ZIP centroids built from the `us-zips` dataset and
collapsed to ~1,400 prefixes (under 10 KB gzipped, worst case 1.5° of latitude,
median 0.23°). There is deliberately no geocoding service in the loop — the app
is meant to keep working in a shed at the bottom of the garden, which is where
you would be standing when you wanted it.

**A US location sets the weather too, offline.** Latitude alone cannot tell you
your climate — two places at 45°N can be Portland or Ulaanbaatar — so the app
carries real weather for the whole country instead: NASA POWER's climatology
for every grid cell the ZIP table lands in (976 cells of 0.5° × 0.625°, about
64 KB gzipped, loaded only when first needed and precached for offline use).
Each cell holds 2011–2025 monthly temperature and rain from MERRA-2, sunshine
from the CERES satellites, and reference ET computed with FAO-56
Penman–Monteith. Against the measured Ann Arbor record the Ann Arbor cell is
within about 3% on rain and 4% on evaporative demand.

When you enter a ZIP or use your location, the site takes, in order: a saved
record within 30 km (what you fetched or measured beats a coarse typical), else
the built-in cell, else — outside the US — the climate it already had, with a
note saying so. Picking a climate preset afterwards changes only the weather;
a located site stays where it is. (It used to move to the preset's home
latitude and keep its longitude, which once sent an Ann Arbor fetch to the
shore of James Bay.)

The table is rebuilt by the **Build offline weather averages** workflow
(Actions tab → Run workflow, from a working branch rather than `main`), which
runs `scripts/build-climate-normals.mjs` and commits the result to that branch; `missing` mode fills only cells a rate-limited run
left out. These data were obtained from the NASA Langley Research Center
(LaRC) POWER Project funded through the NASA Earth Science/Applied Science
Program.

**Sun comes from geometry.** The climate preset knows how cloudy a place is;
latitude knows how much sun there is to be blocked, how high it climbs and how
long the day runs. Set a latitude and the monthly sun-hours are recomputed
from the standard FAO-56 solar equations at the preset's own clearness, so a
Mediterranean climate at 55°N means sunny weather with a northern sun angle
rather than Andalusian irradiance. Panels follow. Crossing the equator flips
the seasonal series. The canvas draws the result as a real sun-path diagram —
polar projection, centre overhead, rim at the horizon — for the longest and
shortest days at your latitude.

**Input chains are solved, not assumed.** Each month runs a damped fixed-point
pass: a system that cannot get its required inputs is derated, which changes
what is available to everything downstream. Hens with no feed source run at a
fraction of capacity and say so; the beds that were counting on their manure
feel it. Inputs marked optional (a compost bay would *like* woody material)
compete for surplus but never register as a household shortfall.

**Your site is in the way.** A climate preset knows how much sun falls on a
region; it has no idea about your neighbour's conifers. Draw the obstructions
that are already there — buildings, fences, hedges, trees, the wall over the
boundary — give each a height and a foliage type, and the model casts real
shadows: an obstruction of height H with the sun at altitude a throws a shadow
`H / tan(a)` directly away from the sun's azimuth. Every plot is sampled at
five points, every month at up to thirteen times of day, and each moment is
weighted by the sine of the sun's altitude, so an hour lost at noon costs far
more than an hour lost at dawn.

The result is a per-plot, per-month sun exposure figure that scales output by
how much each system actually cares — panels almost linearly, vegetables less,
a water tank not at all. So the app can tell you *"this bed sees 55% of the
available sun and the neighbour's conifer takes the largest share"*, which is
the sort of thing no preset can ever work out for you. A scrubber above the
canvas parks the sun at any month and hour and sweeps the shadows across the
plan; December mid-afternoon is where most yards keep their secrets.

Two details worth knowing. Shading carries an observer height, so a house never
shades the panels bolted to its own roof and a boundary fence never shades a
roof at all. And a bare deciduous tree stops roughly a third of the light a
leafy one does, so the same oak is priced differently in February and July.
Tall perennials you plant are obstructions too — a mature fruit tree does not
care that you filed it under food — though nothing ever shades itself.

**Slope changes both halves.** Ground leaning towards the equator behaves like
a lower latitude and picks up winter sun; leaning away, the reverse. Steepness
also sets how much rain runs off before it can soak in, which raises irrigation
demand on steep clay and is exactly what a swale is built to intercept — so the
same swale is worth far more there than on flat sand.

**Marked ground stays advisory.** Tag areas as wet, dry, rocky, a frost pocket,
or off limits, and the model names the conflict when you put something
unsuitable on them. It does not silently dock the yield: it tells you, and
leaves the call to you.

**Storage is real.** Tanks, ponds, batteries and root cellars carry surplus
forward up to their capacity and are drawn down when production falls short —
which is what turns "my roof catches plenty of rain annually" into "and I still
run dry in August."

## Layout

```
src/engine/     the model — types, climate, catalog, simulation, tests
src/state/      Zustand store, persistence, memoised simulation
src/ui/         canvas, panes, charts, shared components
```

`src/engine` has no React import anywhere and is tested on its own.

## Making it yours

The catalog in `src/engine/catalog.ts` is a starting point, ~70 systems across
water, food, energy, sanitation, soil and shelter. Two ways to correct it:

1. **In the app** — Catalog tab → a system → *Your numbers*. Set its tier, scale
   its output against what you actually harvested, override individual yearly
   figures, and keep notes. Overrides live in your saved design, so an update to
   the shipped catalog never overwrites your measurements.
2. **In the code** — edit `CATALOG` directly if you want a system that is not
   there at all. Every entry is a plain object; `notes` and `sources` are
   required by the tests, because a number without provenance is how a design
   ends up resting on something nobody checked.

Site presets are the same deal. Six climates ship as defaults and all of them
are worth replacing with a rain gauge, a year, and your own readings.
