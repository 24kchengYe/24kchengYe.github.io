# Yecheng Zhang's Academic Homepage

A single-column academic homepage built with Jekyll. The layout takes inspiration
from [Andrej Karpathy's homepage](https://karpathy.ai/): text, whitespace, and
ordinary links. English, Chinese, and Japanese are available from the language
switcher.

The page shows a short introduction, four research entries, three projects, and
experience. Additional papers, descriptions, news, and background remain
available in native expandable sections. Publication status is shown alongside
each paper.

- `_pages/about.md`: all homepage content; keep the three language versions together.
- `_layouts/minimal.html`: document shell and section/language navigation.
- `assets/css/minimal.css`: responsive styling.
- `assets/js/minimal.js`: language preference and existing section-link support.

The homepage does not load a framework, external font, visitor map, or citation
badge service. The earlier AcadHomepage templates remain in the repository.

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

Visit http://localhost:4000

GitHub Pages builds the site from `main`. `_preview/` is reserved for local
screenshots and verification artifacts and is excluded from Git.
