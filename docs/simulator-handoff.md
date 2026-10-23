# Simulator handoff — 23 October 2026

Written by the first simulator chat for the next one. It is dated on purpose:
treat it as a snapshot, and check the repo when they disagree.

## What it is for

Alon's yard in Ann Arbor, Michigan (ZIP 48104). The simulator was built to
reflect the systems tested there, while keeping everything else in the
catalog as researched or unproven options. Its model follows the Land Lab
simulator: drag systems onto a plan of the yard, and see how far they cover
a household's needs month by month. The difference is that every number
carries where it came from.

## Where it stands

- **Catalog:** 73 systems. The 17 most recent come from the yard itself:
  felt grow bags and wall pockets, upside-down pepper planters, grow
  trellises, first flush, Chapin bucket drip, the pump-fed drip kit, the
  Aerobin, the rain garden, the indoor tower, the biochar tote, the food
  recycler, worm tea, the nettle patch, banana peel tea, wood ash and urine
  feed.
- **Evidence:** five tiers, from Unproven through Researched to three tested
  ones (did not work / partly worked / works). Tested tiers come only from
  the yard log, which syncs through the website, so every device sees one
  record. Seeded results: Aerobin, biochar kiln and tote, and aquaponics
  *works*; nettle ferment and banana peel tea *partly worked* (one moulded
  batch and one good one each). Alon has since logged more from the app.
- **Site:** a ZIP or "Use my location" sets the sun *and* the weather. Weather
  comes from built-in 2011–2025 NASA POWER averages for every US grid cell
  the ZIP table reaches, or from 15 years of measured ERA5 fetched in-app,
  kept as saved locations. Also: slope and aspect, shade from the house, trees
  and fences, painted zones, existing features.
- **Plan:** an illustrated canvas with a mark per system, drag-to-resize,
  sun path and shadow scrubber.
- **App:** an offline-capable PWA. It is built so Capacitor can wrap it for
  iOS and Android later; the steps are in the README.

Tests: 170, all passing. Pull requests merged: #1 website and status sync
(WordPress chat), #2 README note, #3 yard log (WordPress chat), #4 yard
results read from the log, and the guard on website ids.

## Parked by Alon, not forgotten

- **An allowlist for the weather archive.** The environment's network policy
  blocks Open-Meteo. Alon's admin would have to allow
  `archive-api.open-meteo.com`; a request was drafted. In-app fetches from a
  phone or browser already work, since only this sandbox is blocked.
- **iOS and Android apps.** Capacitor, Apple's $99 a year and Google's one-off
  $25. Not started.

## How Alon likes to work

- Plain, short answers, and a recommendation rather than a menu.
- Ask before anything outward-facing: merging, posting, deleting, other
  sessions. He usually merges pull requests himself, or says "merge".
- He prefers illustrated, friendly graphics to technical ones.
- **When a reply has anything meant for the WordPress chat, end it with:**
  > 📌 **Ping the WordPress chat:** paste "The simulator chat replied to your
  > message. Read its latest message in its transcript."

  He asked for this every time. It is needed only while the simulator chat
  cannot message the WordPress chat itself: if this chat has a tool that
  sends to another session, use that instead, and say so. The WordPress chat
  is titled "Yard sustainability WordPress site", and it can message this
  chat directly.

## Learned the hard way

- **The white pages came from two sources.** First, a stale service-worker
  shell, fixed by keeping `index.html` out of the precache and fetching pages
  network-first. Second, GitHub's own branch publisher racing the deploy
  workflow, fixed by setting the Pages source to GitHub Actions. If a white
  page comes back, check those two first, then `normalizeDesign`.
- **Choosing a climate preset used to move the site** to the preset's home
  latitude while keeping its longitude, so a later fetch landed in James Bay.
  A located site now stays put. Don't reintroduce that.
- **NASA POWER climatology `T2M_MAX` / `T2M_MIN` are monthly extremes,** not
  mean daily highs and lows. Use `T2M_RANGE` (see
  `scripts/build-climate-normals.mjs`). Four concurrent requests get
  rate-limited, so the script runs two at a time.
- **Scheduled tasks can't carry messages to another chat.** Firing one by
  hand starts a brand-new session instead of reaching the one it names.
- **Only one session receives a PR's events.** Don't subscribe to a pull
  request the WordPress chat is driving.
- `npm run typecheck` used to emit a `.js` file beside every source, and they
  got committed once. It now typechecks only. If `.js` files appear in
  `src/`, delete them: Vite resolves `.js` before `.ts`.
- **The yard log is the system of record for results.** A tier chip for a
  tested result no longer exists in the Catalog. A design imported with a
  tested tier the log has never mentioned gets carried into the log as a
  private entry.

## Ideas not taken up yet

- Finer offline weather in the mountain West, where a 0.5° cell blurs valley
  and ridge. Anchorage's rain comes out about double the city's.
- Record dates for the yard's results, so the log shows a season-by-season
  history and not just the latest result.
