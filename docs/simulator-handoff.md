# Simulator handoff — 26 October 2026

Written by the first simulator chat on 23 October, and brought up to date by
the second. It is dated on purpose: treat it as a snapshot, and check the repo
when they disagree.

## What it is for

Alon's yard in Ann Arbor, Michigan (ZIP 48104). The simulator was built to
reflect the systems tested there, while keeping everything else in the
catalog as researched or unproven options. Its model follows the Land Lab
simulator: drag systems onto a plan of the yard, and see how far they cover
a household's needs month by month. The difference is that every number
carries where it came from.

Since 26 October it is meant for other people too, each on their own
device. Only Alon's devices are connected to the website.

## Where it stands

- **Catalog:** 73 systems. The 17 most recent come from the yard itself:
  felt grow bags and wall pockets, upside-down pepper planters, grow
  trellises, first flush, Chapin bucket drip, the pump-fed drip kit, the
  Aerobin, the rain garden, the indoor tower, the biochar tote, the food
  recycler, worm tea, the nettle patch, banana peel tea, wood ash and urine
  feed.
- **Evidence:** five tiers, from Unproven through Researched to three tested
  ones (did not work / partly worked / works). Tested tiers come only from
  the device's own yard log, which starts empty. Alon's syncs through the
  website, so every one of his devices sees one record. His early results
  (`ANN_ARBOR_LOG`): Aerobin, biochar kiln and tote, and aquaponics
  *works*; nettle ferment and banana peel tea *partly worked* (one moulded
  batch and one good one each). Anyone else sees them on a system's yard
  log card as evidence from one yard, never as their tier. Alon has since
  logged more from the app:
  felt hanging pockets and Chapin bucket irrigation are published as *works*,
  and the indoor hydroponic tower is on the site as a draft with no result.
- **History:** every log entry is dated, and a system keeps all of them,
  newest first, in the app and on its website page. The Catalog tab opens
  with the whole yard's log season by season (`logBySeason`), so a year
  reads as one story.
- **Site:** a ZIP or "Use my location" sets the sun *and* the weather. Weather
  comes from built-in 2011–2025 NASA POWER averages for every US grid cell
  the ZIP table reaches, or from 15 years of measured ERA5 fetched in-app,
  kept as saved locations. Also: slope and aspect, shade from the house, trees
  and fences, painted zones, existing features.
- **Plan:** an illustrated canvas with a mark per system, drag-to-resize,
  sun path and shadow scrubber.
- **App:** an offline-capable PWA. It is built so Capacitor can wrap it for
  iOS and Android later; the steps are in the README.

Tests: 176, all passing. Pull requests merged: #1 website and status sync
(WordPress chat), #2 README note, #3 yard log (WordPress chat), #4 yard
results read from the log, and the guard on website ids, #5 these notes, #6
"labor" spelling on the website (WordPress chat), #7 notes and network, #8
WordPress sample content (WordPress chat), #9 the season-by-season log.

## Other people using it

Each person's yard lives on their own device: design, log and photos, in
the browser's storage. There are no accounts. The website link needs the
address and key typed into that browser, so only Alon's devices sync.

- A new device starts with an empty log and no tested tiers.
- A device that never had a log (last opened before 23 October) drops the
  Ann Arbor tiers the starting design used to give it (`withoutStarterTiers`).
- A device opened between 23 and 26 October keeps the Ann Arbor record in its
  log. That was only Alon, as far as anyone knows.
- A new device of Alon's is empty until he connects it to the website; the
  first sync brings his whole record.
- Still Ann Arbor for everyone: the starting site's weather and the saved
  "Ann Arbor, MI" location, until a ZIP is set. The Site tab says so until a
  location is set (`atStartingPlace`).

**Who may open it is decided at the host, not in the app.** On 27 October
the simulator moved behind Cloudflare Access: Cloudflare Pages project
`mmssim` (`mmssim.pages.dev`), Zero Trust team `makemisim`, one Access
application covering `mmssim.pages.dev` and `*.mmssim.pages.dev`, sign-in by
an emailed one-time code, sessions of 30 days, and a reusable policy,
"Invited people", that lists the allowed emails. Alon adds or removes people
there. The move, in order:

1. Gate the empty project, then deploy to it (`cloudflare.yml`, once the
   `CLOUDFLARE_*` secrets are set).
2. Make the repo private, and switch GitHub Pages off, so the old public copy
   goes. `pages.yml` and the "repo is public" rules in `CLAUDE.md` change then.

**Accounts inside the app are deliberately not built.** They would add the
same yard on several devices and a backup. If that is ever needed, keep it
on Cloudflare (a Worker with D1 and R2 that reads the Access identity), not
Supabase: one sign-in, not two. Keep other people's accounts off the
WordPress site.

## Being tested

- **Photos, end to end.** No photo has yet gone to the real host, or come
  from a real phone camera. Alon is testing it. If you change the photo path
  (`src/state/photos.ts`, or the `/photo` upload in `websiteSync.ts`), tell
  the WordPress chat so it can recheck the server side.

## Parked by Alon, not forgotten

- **iOS and Android apps.** Capacitor, Apple's $99 a year and Google's one-off
  $25. Not started.

The weather archive allowlist that used to be parked here is moot: see "What
this environment can reach" in `CLAUDE.md`.

## How Alon likes to work

- Plain, short answers, and a recommendation rather than a menu.
- Ask before anything outward-facing: merging, posting, deleting, other
  sessions. He usually merges pull requests himself, or says "merge".
- He prefers illustrated, friendly graphics to technical ones.
- **Message the WordPress chat directly, and tell Alon you did.** It is
  titled "Yard sustainability WordPress site". Use `send_message` from the
  Claude Code Remote MCP server, addressed by session ID; find the ID with
  `list_sessions`. Short names from `ListAgents` don't resolve, since it sees
  only sessions on the same machine. Only a chat without `send_message`
  falls back to ending its reply with:
  > 📌 **Ping the WordPress chat:** paste "The simulator chat replied to your
  > message. Read its latest message in its transcript."
- **One simulator chat at a time.** The current one is "Simulator status and
  chat messaging". "Yard systems simulator (2)" is archived. The first,
  "Yard systems simulator app", stays open for questions only: don't give it
  work, or two branches will edit the same files.

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
- Split the seeded results that tell more than one attempt. Nettle ferment
  and banana peel tea are each one *partly worked* entry for a batch that
  moulded and one that worked; as two entries they would read *did not
  work*, then *works*, and their badges would change. Aquaponics and the
  Aerobin fold a rough start in the same way. Alon's record, so his call,
  and it needs the dates of each batch.
