# Academic homepage server pilot

Deploy only the verified GitHub Pages output, not this repository or a local
working directory. The pilot includes the academic site and six R1/V3 PDFs
(original, Chinese, bilingual). All other reports remain public-source links.

Runtime: `/opt/yechengzhang-academic`. Keep `compose.yaml`, `nginx.conf`, and
`releases/<commit>/site` here; `releases/current` points to the selected release.
The static service uses the existing nginx image, caps CPU and memory, and joins
the existing `caddy_web` network. No database, credentials, build process, or
translation worker belongs in this service.

Before a release, reject symlinks, paths outside the artifact, logs, private
configuration, and unexpected pilot PDFs. Record every published file's SHA256.
Replace internal GitHub Pages origins in generated HTML/XML with the pilot
origin; retain external research-source and repository links. Validate relative
links, PDF hashes, JavaScript MIME, HTTP Range, and all three languages.

For first deployment, create the DNSPod A record for the named host. Append only
the fragment to `/opt/caddy/Caddyfile` after making an operational backup. Validate
the complete candidate, preserve the live file inode, then reload Caddy. Do not
restart the shared Caddy container or any existing application.

Rollback this service by restoring `releases/current` to a previously verified
release. A first-deploy rollback stops only this compose project and removes
only its DNS record and exact Caddy block after validation. Never replace a live
Caddyfile with an old backup if another application has changed it meanwhile.
Retain deployment records and runbook entries outside the public web root.
