# Working in this repository

Two products share this repo, and two Claude chats share the work:

- **The simulator** (`src/`, `scripts/`, `tools/`): a React + Vite PWA that
  simulates a yard's water, food, energy, soil and shelter systems. It is
  published to GitHub Pages from `main`. The *simulator chat* owns it, along
  with `pages.yml`, `ci.yml` and `climate-normals.yml`.
- **The yard website** (`wordpress/`): a WordPress theme and plugin,
  deployed to a staging site by `wordpress.yml`. The *WordPress chat* owns it.

Stay on your side. When a change needs the other side, say so to Alon (and to
the other chat if you can message it) instead of editing its files.

The two sides meet in one contract: **"What the simulator has to send"** in
`wordpress/README.md`. The website follows simulator systems by id, so never
rename or remove a catalog id without agreeing it first.
`src/engine/siteContract.test.ts` reads the ids from the plugin and fails if
one goes missing.

Where things stand, and what was learned getting here: `docs/simulator-handoff.md`.

## Commands

```
npm ci            # a fresh container has no node_modules
npm test          # vitest, the whole suite
npm run build     # tsc -b (typecheck, writes no JS) + vite build
npm run typecheck # typecheck only
npm run dev       # local dev server
```

Run the tests and the build before every push. For anything visible, also
drive the built app in Chromium: Playwright is not a project dependency, but
the browser is at `/opt/pw-browsers/chromium` (a link to the versioned
build, whose folder name changes). Install
`playwright-core` in a scratch folder, and use a fresh profile *and* an old
saved design.

## Branches, pull requests, deploys

- `main` is the live site. Nothing is pushed to it directly: work on your own
  branch, open a pull request, and Alon merges it, or asks you to.
- `ci.yml` ("Check") runs the tests and the build on every other branch and
  every pull request. `pages.yml` deploys only from `main`.
- GitHub Pages must stay on **Source: GitHub Actions**. If a "pages build and
  deployment" run appears in the Actions tab, someone has switched it back to
  deploying from a branch. That publishes the raw repo root, a white page,
  racing the real deploy.
- Commit messages say what changed and why, in plain sentences.

## Rules the code depends on

- **Evidence tiers, and whose they are.** Neither the catalog
  (`src/engine/catalog.ts`) nor the starting design ships a tested tier.
  Tested tiers come only from the device's own yard log (`yardLog.ts`),
  which starts empty, because anyone may use the app. `ANN_ARBOR_LOG` is
  Alon's yard's early record: shown to everyone else as evidence from one
  yard, never merged into anyone's log. His live record is on the website,
  and his devices get it by syncing. Only his devices hold the website key.
- **Old saves must keep loading.** A saved design that crashes the app is a
  white page and a lost yard. When `Design` or `SiteProfile` gains a field,
  supply it in `normalizeDesign` and add an old-shape case to
  `normalize.test.ts`.
- **Provenance travels with numbers.** Every catalog entry has `notes` and
  `sources`, and every climate record has a source and years. Generated data
  files say how to rebuild them.
- **Offline first.** The location lookup, the ZIP table and the weather
  averages all work with no network. Don't add a step that needs one where
  the user would be standing in the yard.

## What this environment can reach

Checked on 26 October 2026: cloud sessions now reach NASA POWER and
`*.github.io`, so a deploy can be confirmed by loading the live page as well
as by its workflow run. Open-Meteo answers too, but the sandbox shares its
outgoing address with other users, and the free daily limit is often spent
already (HTTP 429). Bundled weather data is still built in GitHub Actions, so
that it is reproducible: the "Build offline weather averages" workflow
(`missing` mode fills gaps after a rate-limited run).

The WordPress staging site is reachable over HTTPS, so its pages and REST
routes can be checked directly. SSH is not: the proxy carries only HTTPS, so
`wordpress.yml` in GitHub Actions does every deploy and every WP-CLI command.

## The repo is public

No keys, passwords, tokens or personal contact details in commits, pull
requests or comments. The website sync key lives in the browser, never in
the repo.
