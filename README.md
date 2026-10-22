# Yecheng Zhang's Academic Homepage

A single-column academic homepage built with Jekyll. The layout takes inspiration
from [Andrej Karpathy's homepage](https://karpathy.ai/): text, whitespace, and
ordinary links. English, Chinese, and Japanese are available from the language
switcher.

The page shows a short introduction, five research entries, three projects, and
experience. Additional papers, descriptions, news, and background remain
available in native expandable sections. Publication status is shown alongside
each paper.

- `_pages/about.md`: all homepage content; keep the three language versions together.
- `_layouts/minimal.html`: document shell and section/language navigation.
- `assets/css/minimal.css`: responsive styling.
- `assets/js/minimal.js`: language preference and existing section-link support.

The **Reading** link opens `/reading/`, a separate foundation model bibliography
using the same page width and typography. It starts with the core 20 reports;
the selected 105 and full 643-entry archive remain available. Three reading
paths, technology filters and search use shareable query URLs. With JavaScript
disabled, the complete list of source links is still readable.

- `_pages/reading.html` and `_layouts/reading.html`: the reading page.
- `_data/reading.json`: public report metadata and existing reading keywords.
- `assets/css/reading.css` and `assets/js/reading.js`: layout and filtering.
- `_tools/export_reading.py`: rebuild the public index from a local archive:

  ```bash
  python _tools/export_reading.py --source /path/to/local/report/archive
  ```

The exporter uses an explicit field and source-domain allowlist. It includes
official links, not downloaded reports, machine translations, personal routes
or internal knowledge-base notes. Years follow the source catalog, not verified
model release dates. Technology tags exist for the selected reports only.
The detailed source hashes and audit are kept locally in the ignored `_preview/`
directory. The public bibliography and the local reading workspace can therefore
share metadata without sharing their document contents.

The homepage does not load a framework, external font, visitor map, or citation
badge service. The earlier AcadHomepage templates remain in the repository.

## Selected Writing

Selected writing appears before research, in both page order and navigation.
All six blogs and all three technical reports support the homepage's English,
Chinese, and Japanese switcher. Language choices persist across article,
technical-report, and homepage links. Figure labels, captions, alt text, tables,
and article controls follow the same language. Zoom opens the current-language
figure.
The three Spec articles open as a Blog, with a Blog / Technical report switch
above the title. Nimble / KEV is blog-only. The current edition is underlined. The series title on the
homepage uses normal-case, regular-weight body-sized text, with its description below.

- `_includes/writing.html`: three published articles and a forthcoming fourth entry,
  progressing from Spec generation and repair to Rubric Judge training and
  Spec-as-chain-of-thought coding-agent training. The fourth entry has no article
  link until its text is ready. An initially collapsed More writing section holds
  the Nimble / KEV experiment blog and the visual guide to attention.
- `writing/spec-generation/`: full multilingual essay and technical report.
- `writing/spec-repair/`: Judge–Fix essay and technical report.
- `writing/rubric-model/`: rubric-model essay and technical report.
- `writing/nimble-kev/`: soft-label routing experiments, methods, and matched-data comparisons.
- `writing/attention-mechanisms/`: six design questions spanning eighteen attention concepts.
- `writing/figures/{en,zh,ja}/`: generated language-specific SVGs.
- `writing/assets/`: original content-addressed assets retained for existing links.
- `_data/writing/`: public Chinese article sources and English/Japanese translations.
- `_tools/build-writing.cjs`: reproducible static article assembly; no translation API.
- `_tools/build-figures.cjs`: deterministic localized diagram export.
- `assets/css/writing*.css`: writing-list and article styles.
- `assets/css/research-note.css`: the shared compact research-note layout.
- `assets/css/homepage-marks.css` and `assets/js/homepage-marks.js`: decorative
  marks for research, projects, institutions, and datasets. These are custom
  visual cues, not official company logos or university seals.

The public editions omit local source inventories and deployment identifiers.
Private experiment files, full source archives, and local publication manifests
are not included. Existing homepage prose and destinations remain unchanged.

After editing an article source or translation, run `npm ci` and `npm run build:writing`.
The build checks translation coverage. Commit the generated HTML with the sources.
The old offline exporter is not the public-site build path.

### Editable Figures

The nine article editions share **74 figures**. The first six used 25 PNGs and
30 SVGs with outlined text; Nimble / KEV adds four editable HTML/CSS diagrams,
the attention guide adds twelve, and the coding-agent article adds three.
All article figures now use localized SVG exports:

- The 25 generation figures retain their original **HTML/CSS layouts**.
  The exporter places that layout in an SVG `foreignObject`, preserving the
  dotted backgrounds, spacing, connectors, and typography without rasterization.
- The other 30 figures retain their **SVG geometry**, with editable `<text>`
  labels in place of font outlines. Translated labels use the space inside
  their nodes and between neighboring labels, rather than squeezing English
  into the width of the original Chinese text.
- `_data/writing/figures/manifest.json` maps original assets to named source files.
- `_data/writing/figures/translations.json` stores Chinese keys with English and
  Japanese label pairs. Article prose and figure labels have separate dictionaries.

Edit the `.html` or `.svg` source to change a layout, and its dictionary to change
wording. Run `npm run build:writing` to regenerate all three languages and all nine
articles. Do not edit `writing/figures/` directly. Each figure has a collapsed
source link to its editable file and translation dictionary. No runtime diagram
library, translation service, external font, or extra model call is required.
SVGs with HTML layouts target web browsers; the original PNGs remain available
for non-browser tools that do not implement `foreignObject`.

The fourth selected blog is `/writing/coding-agent-trajectories/`. Its three
panels preserve 34 workflow nodes and 45 logical connections; the Online–Offline
handoff appears at both panel boundaries. Edit `cli-trajectory-flow.json` for
topology and `_tools/build-cli-figures.cjs` for layout. The writing build regenerates
the HTML/CSS figure sources before exporting localized SVGs. Experiment tables
separate artifact evaluation, guided continuation, and local editing.

### Trajectory Figure Review

The trajectory article has eight inline diagrams; the separately exported Harness
panel brings its figure set to nine. Keep HTML canvas sizes, manifest dimensions,
and exported SVG viewBoxes identical. The build rejects a mismatch. Layouts marked
`data-fixed-type` own their typography and child structure; the exporter must not
wrap their children or change their font sizes.

After `npm ci` and rebuilding, install the review browser with
`npx playwright install chromium`, then run `npm run check:cli-figures`.
Alternatively, `CHROME_PATH` may point to an installed Chrome executable;
`FIGURE_REVIEW_DIR` can override the default ignored `_preview/figure-review/`.
The check serves the local files, renders all 27 language-specific SVGs as XML,
checks text bounds and overlaps, then tests the article at desktop and mobile widths.
It also checks language switching, image proportions, fit/zoom/scroll/drag,
viewport resizing, keyboard opening, closing and focus restoration. Review the
saved screenshots as well: geometry checks do not establish semantic correctness.

The article's image viewer opens with the whole figure visible. Fit width, zoom
buttons and scrolling/dragging reveal details without cropping the source image.
Viewer controls and figure text follow the article's language selection.

### Interactive Trajectory Maps

The coding-agent article uses the same pan, zoom, module navigation, and muted
visual language as Automation Blueprint. Its eight inline maps expose nine views,
including the full workflow, shared Harness, Online/Offline feedback, planning,
and a recorded-case replay. Each map navigates independently. All controls and
diagram labels follow the article's language selection.

- `_data/writing/trajectory-map.json`: view links, replay order, and control translations.
- `_tools/build-trajectory-map.cjs`: extracts the existing localized diagram canvases;
  rejects broken links or replay references. It does not rewrite workflow geometry.
- `assets/js/trajectory-map-data.js`: generated canvases for all three languages.
- `assets/js/trajectory-map.js` and `assets/css/trajectory-map.css`: Shadow DOM
  component, isolated styles, keyboard/pointer navigation, and playback controls.

The replay has 21 display events: 15 model attempts plus checkpoint/rewind events.
There are still 13 retained turns and two failed attempts. Playback performs no
tool calls. Checkpoint revisits preserve the failure → rewind → retry order.
Static SVGs and their captions remain available below each map, with JavaScript
disabled, and when printing. The original image viewer is unchanged.

After rebuilding, run `npm run check:trajectory-map` as well as
`npm run check:cli-figures`. The interactive check compares text, node IDs, and
edges against the static source for all 27 view/language combinations, then
tests navigation, replay state, fit-all bounds, mobile layouts, print, no-JS
fallback, and the unchanged Automation Blueprint. Review screenshots under
`_preview/trajectory-map/`; use `MAP_REVIEW_ORIGIN` to check the deployed site.

Public reports allow same-origin image, script, and stylesheet files in their
Content Security Policy. The offline export's `img-src data: blob:` policy
cannot load the site's separate figure files. External connections remain disabled.

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

Visit http://localhost:4000

GitHub Pages builds the site from `main`. `_preview/` is reserved for local
screenshots and verification artifacts and is excluded from Git.
