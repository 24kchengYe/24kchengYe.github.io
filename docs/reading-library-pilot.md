# Reading library pilot

The bookshelf is now the default `/reading/` page. The old
`/reading/library-preview/` URL redirects here with its query and fragment intact;
the six PDF assets keep their existing URLs. The old separate list landing page
is replaced by the bookshelf's Index view. It uses the homepage's shared font,
width, navigation and language switch.

Three collections share one interface:

- **Technical reports**: the existing 643-entry bibliography, core/selected/all
  scopes, technology search and the R1/V3 reader.
- **AI learning**: 480 catalog entries arranged on ten topical shelves. A book
  represents one paper/resource entry, not an entire subject. The overview shows
  one row per topic; opening a topic exposes its full collection with pagination.
  Search includes explicit method names and common acronyms such as GRPO/PPO.
- **Researchers**: six personal blogs and twelve selected essays, presented as
  authors' collected writing. No current employer claims are inferred.

The learning catalog preserves the selected Foundation Models document's order.
480 is the number of catalog entries, not deduplicated papers: some entries group
several resources and some papers occur in several topics. 444 entries have a
public source link; 36 keep their title with a source-pending label. 26 entries
link to an existing technical report. These are metadata projections, not copies
of internal notes or claims that all source URLs have been independently checked.

The reference is [Michel Johnson's bookshelf](https://micheljohnson.top/#blog).
Its Three.js shelf inspired the interaction, not the visual assets or code. This
implementation is original HTML/CSS, with normal keyboard-accessible buttons and
reduced-motion support. No WebGL scene is required.

## Measured scope (2026-10-23)

Decimal MB/GB, from the actual local catalog and existing finished editions:

| Material | Count | Bytes |
| --- | ---: | ---: |
| Original reports and model cards | 643 (574 PDF, 69 Markdown) | 4,578,947,460 |
| Chinese editions | 106 | 654,338,753 |
| Bilingual editions | 105 | 1,161,901,997 |
| Original + existing translated files | — | 6,395,188,210 |
| Two-report pilot, all three editions | 6 PDF files | 29,610,119 |

106 reports have a generated translation; 537 have none. All 105 selected reports
have generated editions. These counts describe generated files, not full semantic
or typographic review. The two pilot reports retain the 2026-10-21 audit findings
in all three interface languages. No new translations were started.

Baseline `0e8e0ff` tracks 174,846,527 bytes across 1,009 files, including source
files that Jekyll does not publish. This is a Git tree measurement, not a measured
deployed site size. The pilot adds about 29.6 MB of PDFs, 6.6 MB of a self-hosted
PDF.js runtime and less than 1 MB of metadata and interface code. The private
translation workspace also includes about 16.8 GB of caches and historical runs;
those are not publication assets and are excluded.

## Hosting decision

[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
allow published sites up to 1 GB and a soft 100 GB/month bandwidth limit. The
two-report pilot fits; the 6.40 GB current collection does not. Ordinary Git also
[blocks files larger than 100 MiB](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
The largest original, DALL·E 3's system card, is 150,720,057 bytes.

For the full collection, keep the lightweight site and catalog on Pages and put
the files on the user's server, or move the whole site there if preferred. The
server's free disk space and configuration have not been measured in this pilot.
There is no migration or server configuration change in this revision.

GitHub Releases are an alternative distribution channel: the
[documented limit](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
is 1,000 assets per release and 2 GiB per asset, with no total release or bandwidth
limit. Releases are better for downloads than an integrated browser PDF reader.
Direct file serving from the user's server is the intended next option.

## Data and update contract

- `_data/reading.json`: existing public bibliography, stable report IDs, curated
  keywords and reading order; no internal note bodies.
- `_data/reading-publication.json`: explicit publication allowlist, source version
  and file prefix. Currently only R1 and V3. `asset_base_url` can later be an HTTPS
  file host. This changes storage without changing the reader.
- `_tools/build_reading_library.py`: verifies source/translation hashes, exports
  public states and copies only allowlisted PDFs. It refuses a changed source
  version until the publication manifest is reviewed.
- `assets/js/reading-library-data.js`: generated public catalog. `translation`
  records whether a file was generated, `assets` records whether it is available
  online, and `quality` records review state. These are separate fields.
- `_preview/library/inventory.json`: ignored local inventory with original paths,
  exact byte counts, source hashes and published asset hashes.
- `_data/reading-learning.json`: public titles, theme/subsection names, paper
  links and report IDs. `_tools/export_reading_learning.py` regenerates it from
  the selected local Markdown using explicit metadata fields only. The separate
  audit contains source hashes, source lines, exclusions and corrections.
- `_data/reading-researchers.json`: reviewed public blog and article links.
- `_tools/build_reading_collections.py`: checks IDs, allowed fields, links and
  report associations before generating `reading-collections-data.js`.

To update learning metadata, run `export_reading_learning.py --source <selected-md>
--reports _data/reading.json --output _data/reading-learning.json
--audit _preview/learning-collection/learning-audit.json`, review the diff, then
run `build_reading_collections.py`. Never export the existing private hub's
`search`, note bodies, local reader links or internal document URLs. Four upstream
source conflicts are corrected explicitly in the exporter: Phi-4's arXiv ID,
Transformers without Normalization's arXiv ID, Qwen3's repository, and the DPO
survey's title/source. The original local Markdown is unchanged.

To refresh the catalog, run the existing `_tools/export_reading.py --source
<archive>` and then `_tools/build_reading_library.py --source <archive>`. Review the
resulting counts and Git diff. Publishing another report requires an explicit
allowlist addition; a new local translation does not automatically become public.
Keep filenames versioned and preserve old published editions when replacing a
source version. `quality: not_reviewed` is distinct from a successful translation.

The full archive, caches, credentials, private knowledge-base content and personal
routes are never copied. The original local reading page is unchanged.

## Reader

The three tabs select the original, Chinese and bilingual PDFs. The bundled
Mozilla PDF.js renderer draws one page at a time, supports selectable text, page
navigation, deep links and fit-width/zoom. The original PDF remains a direct link.
Language switching does not create Japanese translations or change report content.
Known translation defects remain visible next to the translated edition tabs.

The reader is designed for HTTP(S), including GitHub Pages and a local server;
`file://` previews show a direct-file fallback. For a future separate file host,
serve PDF content types, CORS for the homepage origin, and byte-range requests.
The renderer does not fetch a PDF until the reader is opened. It does not send
content to a translation service.

PDF.js is pinned to `pdfjs-dist` 6.4.299, Apache-2.0; its source URL, archive SHA-256
and license are under `assets/vendor/pdfjs/`. Only runtime files are vendored.

## Validation and boundary

The ignored `_preview/library/verify.cjs` exercises the real rendered preview:
20 core entries, 643 total entries, two online reports, pagination, search, GRPO
filtering, empty states, edition switching, quality notices, language changes,
browser history, page deep links and 320/390/1440 px widths. Screenshots and raw
results live alongside the inventory. This is a UI/storage pilot, not a new
translation quality audit. `Guide: no material change`.

`_preview/library/collections.cjs` additionally checks the ten topical shelves,
480-entry total, complete architecture/training scopes, pagination, GRPO source
and report links, researcher essays, history, legacy routes and 18 combinations
of collection/language/viewport plus their detail panels. Translation jobs and
the PDF publication allowlist are unchanged.
