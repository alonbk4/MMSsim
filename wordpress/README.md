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

No SSH? Run `wordpress/bin/build-zips.sh`, upload `yard-systems.zip` under
Plugins → Add New → Upload and `working-yard.zip` under Appearance → Themes →
Upload, activate both, then *Settings → Yard site → Install starter content*.

## Before it goes live

Everything only you can supply — the name, prices, your story, the drafts to
check, and a photo shot list — is in [`FILL-IN.md`](FILL-IN.md). Then send a
test inquiry and check it arrives by email as well as under Inquiries.
