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

**Local search.** The home page tells search engines this is a service-area
business and lists the towns from *Settings → Yard site*. No street address is
published anywhere.

## Deploying

`.github/workflows/wordpress.yml` lints both on every push that touches
`wordpress/`, uploads the two zips as a build artifact, and deploys them to
the staging site over SSH. It needs these repository secrets (Settings →
Secrets and variables → Actions):

| Secret | |
|---|---|
| `STAGING_SSH_HOST` | e.g. `makemicld.tempurl.host` |
| `STAGING_SSH_USER` | the SFTP/SSH user from the WPMU DEV Hub |
| `STAGING_SSH_PASSWORD` | its password |
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

- **Fill in the `[[YOU: …]]` placeholders.** The dashboard lists every
  published page that still has one.
- **Name it.** Settings → General → Site Title. It is the temporary domain
  until you do, and it appears in every page title and in search results.
- **Photos.** Set a featured image on each system. A menu of systems with no
  pictures of the real thing will not convince anyone.
- **Check the costs.** The materials figures come from the simulator's
  catalog estimates, not from receipts.
- **Publish the drafts that are real.** Seven systems from the yard's list are
  drafts because nothing records how they have done here. Set the tier and
  publish the ones that are running.
- **Delete "Hello world!"**, WordPress's sample post, which otherwise shows
  on the home page.
- **Send a test inquiry**, and check it arrives by email as well as under
  Inquiries.
