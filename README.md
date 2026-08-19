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

| Tier | Meaning | Output band |
|---|---|---|
| **Proven here** | Built and measured on *this* site. Your logs, your numbers. | ×0.9 – ×1.1 |
| **Researched** | Well documented somewhere else, not yet verified here. | ×0.65 – ×1.35 |
| **Unproven** | Speculative, contested, or so site-dependent that a yard-scale figure means little. | ×0.25 – ×1.6 |

Nothing ships as *proven* — that tier means measured on your own site, which no
default can claim for you. So the app tells you not just "this design covers 88%
of your irrigation" but "…and only 58% if the researched and unproven parts come
in at the bottom of their range." As you build and log things here, promote them
and enter your real figures; the bands narrow and the answers stop being a
literature review.

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

**Input chains are solved, not assumed.** Each month runs a damped fixed-point
pass: a system that cannot get its required inputs is derated, which changes
what is available to everything downstream. Hens with no feed source run at a
fraction of capacity and say so; the beds that were counting on their manure
feel it. Inputs marked optional (a compost bay would *like* woody material)
compete for surplus but never register as a household shortfall.

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

The catalog in `src/engine/catalog.ts` is a starting point, ~50 systems across
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
