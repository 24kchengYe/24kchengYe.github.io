# Academic homepage and reading library

Deploy the verified GitHub Pages output, not this repository or a local
working directory. The site stays small; the full document library lives in
server storage, outside Git and outside individual site releases.

`_tools/export_reading_assets.py` validates catalog hashes and finished translation
outputs, creates inert previews for Markdown model cards, and writes two manifests:
`assets-public.json` has public URLs and hashes; `upload-plan.json` has local paths
and must stay outside the public web root and Git. Copy the former into
`_data/reading-assets.json` only for an authorized publication. Run
`_tools/build_reading_library.py` to rebuild the public bibliography asset links.

Upload the manifest's exact files into `releases/library-files` using
`upload_assets.py`. `fetch_originals.py` can retrieve the same official originals
on the server; it accepts a download only when its SHA256 matches the local file.
Fallback to local upload for changed/unavailable originals. Verify the complete
manifest before activating new metadata. Partial files are not served. Hashes
in file URLs allow immutable caching and safe future incremental updates.

The user confirmed public access to the Foundation Models learning originals
on 2026-10-23. `_tools/export_learning_documents.py` exports only the linked
Markdown/PDF/image closure beneath the selected collection directory, renders
sanitized HTML and native MathML, and audits missing references. Its versioned
assets live in `releases/learning-files/<version>`, outside Git. Upload and
verify every batch with `install_learning_batch.py` before committing the public
`_data/reading-learning-assets.json` and rebuilding collection metadata. Do not
copy unrelated notes, source archives, logs or credentials.

`_tools/build_reading_previews.py` creates first-page WebP images for existing
PDF editions. Install the verified bundle using `install_reading_previews.py`;
put the public mapping in `_data/reading-previews.json` and rebuild the library.
The reader shows a small image while PDF.js initializes; it replaces the image
with the selectable PDF page when ready. The original PDF bytes remain intact.
PDF.js is warmed only after a report is selected, and reused between editions.

Learning titles preserve original Chinese headings alongside searchable English
labels. Date provenance distinguishes initial arXiv submission, explicit source
publication metadata and model-card updates. Never use PDF creation timestamps
or local download dates as publication dates. Undated items sort last in both
ascending and descending order; researcher profiles do not get invented dates.

Runtime: `/opt/yechengzhang-academic`. Keep `compose.yaml`, `nginx.conf`, and
`releases/<commit>/site` here; `releases/current` points to the selected release.
The static service uses the existing nginx image, caps CPU and memory, and joins
the existing `caddy_web` network. No database, credentials, build process, or
translation worker belongs in this service.

Before a release, reject symlinks, paths outside the artifact, logs, private
configuration, and unexpected pilot PDFs. Record every published file's SHA256.
Replace internal GitHub Pages origins in generated HTML/XML with the server
origin; retain external research-source and repository links. Validate relative
links, document hashes, JavaScript MIME, HTTP Range, CORS for GitHub Pages readers,
and all three interface languages. Bookshelf entry must not request any PDFs.

For first deployment, create the DNSPod A record for the named host. Append only
the fragment to `/opt/caddy/Caddyfile` after making an operational backup. Validate
the complete candidate, preserve the live file inode, then reload Caddy. Do not
restart the shared Caddy container or any existing application.

Rollback this service by restoring `releases/current` to a previously verified
release. A first-deploy rollback stops only this compose project and removes
only its DNS record and exact Caddy block after validation. Never replace a live
Caddyfile with an old backup if another application has changed it meanwhile.
Retain deployment records and runbook entries outside the public web root.
