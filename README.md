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
All four blogs and all three technical reports support the homepage's English,
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

The eight article editions share **65 figures**. The first six used 25 PNGs and
30 SVGs with outlined text; Nimble / KEV adds four editable HTML/CSS diagrams,
and the attention guide adds six.
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
wording. Run `npm run build:writing` to regenerate all three languages and all eight
articles. Do not edit `writing/figures/` directly. Each figure has a collapsed
source link to its editable file and translation dictionary. No runtime diagram
library, translation service, external font, or extra model call is required.
SVGs with HTML layouts target web browsers; the original PNGs remain available
for non-browser tools that do not implement `foreignObject`.

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
