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
All three full blog articles support the homepage's English, Chinese, and
Japanese switcher. Language choices persist across article and homepage links.
Figures retain their original Chinese labels, with translated captions and
explanations. Technical reports remain in Chinese, explicitly marked on links.

- `_includes/writing.html`: three article entries and their CSS illustrations.
- `writing/spec-generation/`: full multilingual essay and Chinese technical report.
- `writing/spec-repair/`: Judge–Fix essay and technical report.
- `writing/rubric-model/`: rubric-model essay and technical report.
- `writing/assets/`: shared, content-addressed figures.
- `_data/writing/`: public Chinese article sources and English/Japanese translations.
- `_tools/build-writing.cjs`: reproducible static article assembly; no translation API.
- `assets/css/writing*.css`: writing-list and article styles.
- `assets/css/homepage-marks.css` and `assets/js/homepage-marks.js`: decorative
  marks for research, projects, institutions, and datasets. These are custom
  visual cues, not official company logos or university seals.

The public editions omit local source inventories and deployment identifiers.
Private experiment files, full source archives, and local publication manifests
are not included. Existing homepage prose and destinations remain unchanged.

After editing an article source or translation, run `npm ci` and `npm run build:writing`.
The build checks translation coverage. Commit the generated HTML with the sources.
The old offline exporter is not the public-site build path.

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
