# The yard site (WordPress)

The public site: the story of the yard, the systems as a menu people can pick
from, a journal, and an inquiry form. Separate from the simulator in `src/`,
which it describes but does not depend on.

```
plugin/yard-systems/   the content: systems, inquiries, the three blocks, starter content
theme/working-yard/    the look: a block theme, templates, the home page pattern
bin/build-zips.sh      zips both for a manual upload
```

Content lives in the plugin and the look lives in the theme, so the theme can
be changed or replaced without losing a single system or inquiry.

## What it does

**The systems menu** (`/systems/`). One post per system, grouped by category,
each labelled with the same evidence tiers as the simulator: *works here*,
*partly worked here*, *didn't work here*, *researched*, *unproven*. A failed
system stays on the menu as a record and loses its "add to my list" button.
Set the tier, cost, space, upkeep and season in the sidebar box when editing a
system.

**My list.** A visitor adds systems as they browse; a bar follows them round
the site and the inquiry form arrives with those systems ticked. Kept in their
browser only.

**Inquiries.** Saved under *Inquiries* in the dashboard *before* any email is
attempted, then emailed to the address in *Settings → Yard site* (the admin
email if blank). Host mail is unreliable; a saved inquiry is never lost to it.
No nonce on the form, because page caching would serve an expired one; spam is
stopped by a honeypot, a seconds-on-page check and a rate limit. Anything that
looks automated is saved marked `[check]` and not emailed.

**Local search and link previews.** The home page tells search engines this
is a service-area business and lists the towns from *Settings → Yard site*.
No street address is published anywhere. Every page carries a meta
description and link-preview tags, so a page shared on Facebook, Nextdoor or
in a text shows a title, a line and a picture. These step aside when an SEO
plugin is active, so nothing is printed twice.

**The yard log.** What was tried in the yard, when, and how it went: each
entry a date, a result (worked, partly worked, didn't work, or just a note),
a note and a photo. It is written in the simulator (Catalog → a system →
Yard log), on whichever device is at hand, and kept here, so every device
reads and adds to the same record. Connect each device under Site tab →
Website, with the address and the key from *Settings → Yard site*.

- Each website system follows a simulator system (*Simulator system* in its
  sidebar box; several, separated by spaces, where one website system is
  more than one in the simulator, as biochar is). Its badge is the latest
  result in the log, and a system with a result is published. Nothing is
  ever unpublished by the log.
- Public entries show on the system's page under *From the yard log*, newest
  first, and the newest photo stands in as the system's picture until it has
  a featured image.
- A private entry sets the badge like any other and is never shown. Its
  photo is a private attachment, in no public listing; the file itself has a
  random name.
- Photos are resized and re-encoded in the simulator before they are sent,
  which leaves their location and other camera data behind.
- Devices can record offline. Each entry carries the time it last changed and
  the newer copy wins, entry by entry; deleted entries stay as markers so no
  device brings them back.

The key can set badges, add to the log and send its photos, and nothing
else; *Make a new key* retires the old one.

The site's copy of the log is the record: a new device starts empty and
gets it on its first sync. *Settings → Yard site → Download the yard log*
saves every entry as a JSON file to keep, private and deleted ones included,
in the shape `/sync` returns. Photos are in it only as addresses, so a full
backup from the host is still the complete copy. Keep the file private.
*Restore from the file* merges one back in the way a device's sync does: an
entry changes only where the file's copy is newer, so running it on a site
that is already up to date changes nothing. Tiers and publishing then follow
the log as after a sync. Photos come back only if they are still in the
media library.

### What the simulator has to send

The simulator lives in `src/` and changes separately, so this is the
contract between the two. Everything is `POST` under
`/wp-json/yard-systems/v1/`, carries `key`, and gets `401` without the right
one. Cross-origin calls work through the REST API's own CORS handling.

**`/sync`**, JSON: `{ key, statuses, entries }`.

- `statuses`: every simulator system's tier, by simulator id
  (`experimental`, `researched`, `testedFailed`, `testedPartial`,
  `testedSuccess`). Only the untested two are taken from here: a tested tier
  comes from the log, so a device that missed a deletion can't put a result
  back.
- `entries`: the device's whole log, deleted entries included. Each entry:
  `id` and `system` (`[A-Za-z0-9_.-]`, up to 80), `date` (`YYYY-MM-DD`,
  `YYYY-MM` or `''`), `result` (one of the three tested tiers, or `null` for
  a note), `note` (plain text, kept exactly as sent, up to 4,000
  characters), `private` (boolean), `photo` (`{ id }` from `/photo`, or
  `null`), `created` and `updated` (milliseconds), and `deleted: true` once
  deleted.
- An entry replaces the site's copy only if its `updated` is later. A
  deleted entry keeps its id, system and times and loses its note and photo.
- A system's result is that of its latest live entry with a result, latest
  meaning by `date` (as a string, so undated first and a month before its
  days), then `created`, then `id`. Both sides must order entries the same
  way.
- Reply: `{ site, url, changed: [{ title, change }], saved, systems, entries }`,
  where `entries` is the site's whole log after the merge, each photo as
  `{ id, url, thumb, w, h }`, and `saved` is how many sent entries were news.

**`/photo`**, multipart: `key`, `entry` (the entry's id), `photo` (JPEG, PNG
or WebP, up to 15 MB). Reply: `{ id, url, thumb, w, h }`. The same file sent
again for the same entry returns the copy already there. A photo no entry
points to after a day is deleted.

**`/statuses`**, JSON: `{ key, statuses }`. What simulators from before the
log send; still answered. It also takes tested tiers, for systems the log
has never mentioned.

**Journal.** Six first articles, written from the yard's own record, install
as drafts: they are in your voice, so nothing is published under your name
until you have read it.

## Deploying

`.github/workflows/wordpress.yml` lints both on every push that touches
`wordpress/`, uploads the two zips as a build artifact, and deploys them to
the staging site over SSH. It needs these repository secrets (Settings →
Secrets and variables → Actions):

| Secret | |
|---|---|
| `STAGING_SSH_HOST` | e.g. `makemicld.tempurl.host` |
| `STAGING_SSH_USER` | the SFTP/SSH user from the WPMU DEV Hub |
| `STAGING_SSH_KEY` | the private half of a deploy key whose public half is added to that user in the Hub (preferred) |
| `STAGING_SSH_PASSWORD` | or that user's password; the key wins if both are set |
| `STAGING_SSH_PORT` | optional, default 22 |
| `STAGING_WP_PATH` | optional; found automatically by looking for `wp-config.php` |

Without them the deploy step says so and skips. The first deploy to a site
where the plugin is not active also activates the plugin and theme and lays
down the starter content; every later deploy only replaces files, so nothing
changed in the dashboard is switched back. To add starter content that has
been added to the code since, run the workflow by hand with *starter* ticked.

Every deploy also runs `wp yard-update`, which carries text written into the
plugin later (such as answers to the starter content's questions) into a
site already running. It replaces a passage only while the original is still
there word for word, so nothing edited in WordPress is overwritten.

Every deploy ends by clearing the host's static page cache
(`wp hosting clearcache static` on WPMU DEV). Without it, visitors keep
getting the cached old pages, while any URL with a query string, which
skips the cache, shows the new ones. Running the workflow by hand with
*diagnose* ticked prints how caching is set up on the server.

No SSH? Run `wordpress/bin/build-zips.sh`, upload `yard-systems.zip` under
Plugins → Add New → Upload and `working-yard.zip` under Appearance → Themes →
Upload, activate both, then *Settings → Yard site → Install starter content*.

## Before it goes live

Everything only you can supply — the name, prices, your story, the drafts to
check, and a photo shot list — is in [`FILL-IN.md`](FILL-IN.md). Then send a
test inquiry and check it arrives by email as well as under Inquiries.
