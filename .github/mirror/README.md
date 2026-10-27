# Lightweight canonical-site mirror

The server at <https://yechengzhang.duqi.top/> remains authoritative. GitHub Pages
publishes its homepage, Writings, research/project presentation, web Resume and
supporting public frontend assets. Reading documents, learning materials, all
PDFs and accounts remain on the server.

## Automatic publication

`Sync lightweight website` checks at minutes **17 and 47 every hour (UTC)** and
can also be run with **Run workflow**. These minutes are identical in China time.
GitHub schedules can be delayed. The workflow uses the built-in short-lived
GitHub token and official Pages artifact deployment; no server or account secret
is stored in GitHub. The `pages-server-mirror` branch retains the previous manual
snapshot for rollback; subsequent deployments are immutable Actions artifacts.

The server's small `academic-pages-manifest.timer` checks the current release
every minute. It verifies selected public bytes against the release manifest,
then atomically writes `/github-pages-sync-manifest.json`. The timer does not
restart the website, change reading APIs or modify application databases. Its
service is network-isolated, resource-limited and exits immediately after work.

The runner compares the public manifest, public featured/archive placements and
transformation code with `/mirror-status.json`. Unchanged lightweight content
causes no build or deployment. New files are fetched over HTTPS; cached files
are rechecked by SHA-256. A new report-only release does not trigger a mirror
publication. Placement-only changes do.

The runner rejects paths outside the allowlist, oversized exports, PDFs, private
CV links, changed/missing files and missing local dependencies. It checks again
for source changes before building. Failures leave the previous Pages deployment
intact. GitHub Actions retains status and verification reports. The public status
file contains release and sync time only, never accounts or credentials.

## Server installation

Install `policy.py` and `server_manifest.py` in `/opt/academic-pages-sync/` and
create `/var/lib/academic-pages-sync/`. Install the two unit files under
`/etc/systemd/system/`, then enable `academic-pages-manifest.timer` and run the
service once. These are standalone units; no web service reload is needed.

After changing the export policy, update both the repository and these two
server files, then remove `/var/lib/academic-pages-sync/manifest-state.json` or
touch the release manifest to force a recheck. Keep source publication and its
manifest together; unmanifested files are never mirrored.

## Operations

- Logs: repository Actions → **Sync lightweight website**.
- Immediate sync: **Run workflow** on `main`.
- Server export: `journalctl -u academic-pages-manifest.service`.
- Pause: disable this workflow (and optionally stop its server timer).
- Roll back: select the previous successful Pages deployment or switch Pages
  back to the legacy `pages-server-mirror` branch.
- GitHub disables public scheduled workflows after 60 days without repository
  activity. Monthly maintenance writes one tiny record to the independent
  `automation-heartbeat` branch, leaving `main` and the published website alone.
  It uses the built-in token and runs on the first of each month at 03:23 UTC
  (11:23 China time), as well as the first setup/manual run of a month.
  See [GitHub's schedule rules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

The mirror redirects reading/history to the canonical origin and preserves
query parameters and anchors. Owner curation code is removed, while its public
layout is applied statically. The mirror never requests same-origin reading
sessions or changes server cookies/CORS. English/day-mode defaults and the
existing Writings style switch are inherited from the published server files.
