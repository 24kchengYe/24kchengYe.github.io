# Resume content record

The three-language `/resume/` page is a web adaptation of the owner's
`cv/Yecheng_CV.pdf` dated 2026-10-17 (two pages), checked against its LaTeX source.
The original CV remains local and unchanged. Its SHA-256 is
`fd215284597109d1de131a9cc2b426af2ba704079d0ff248785ffb1120be7406`.

The owner explicitly requires the Resume to remain unabridged. The Chinese body is
extracted from the source, retaining all prose, original headings and numbering,
inline emphasis, seven complete paper citations, honors/awards grouping, and source
links. English and Japanese translate each field in full, without summarizing it.
This replaces the earlier condensed preview; do not reintroduce abridgment to make
the page shorter. No new experimental claims are introduced. `Guide: no material change`.

| Web section | Primary source | Checks |
| --- | --- | --- |
| Education | CV p1, 教育背景 | Doctoral student, not a completed PhD; start/end dates preserved. |
| Experience | CV p1, 实习经历 | PDI–Seed–Lark Base AI; ByteIntern; starts 2026.05. |
| Spec-Refine | CV p1, item 1 | Accuracy 29% → 70%; +41 percentage points, not relative percent. |
| Judge/Fix | CV p1, item 2 | 10,000+ trajectories; +35/+45 pp; Fix +20 pp versus GPT-6.1. |
| Agentic RL | CV p1, item 3 | +38 pp token utilization efficiency; P50 3.1 min → 23 sec. |
| UrbanAlign | CV p1, research item 1 | ECCV 2026; first/corresponding author; 72.2%, κ=0.45; +15.1/+16.3 pp. |
| Urban data | CV p2, research item 2 | Dice .684→.756; right-angle ratio .398→.624; 1,000 cities, 14.78M two-period observations; 79,500 downloads. |
| AI4US | CV p2, research item 3 | Both recovered patterns and compressed heterogeneity retained; Qwen2.5-VL-72B scope preserved. |
| Projects | CV p2, 项目经历 | Grant IDs; FY-4B flow matching; 43,000+ nodes and 2.49M+ links; source-snapshot star counts. |
| Honors / activities | CV p2, 荣誉奖励、社会活动 | Ten awards/honors; nominee remains nominee; CAST doctoral program and National Scholarship included. |

Owner-provided overrides already established in this chat:

- Display the GenAI urban science paper as **arXiv**, rather than advertising the review venue.
- Date the Tsinghua National Scholarship **2026.09**.

The English and Japanese versions translate the same entries and comparisons.
Institution and award names use descriptive translations where the source supplies
only Chinese. Publication titles and technical model names remain in their original
form. Downloads and GitHub stars are the October 2026 CV snapshot, not live statistics.
Contact details, including the phone/WeChat field, follow the CV. The location is
explicitly a preferred work location, and the career-interest field uses the source's
broader “Agentic”; the internship subsection retains “Agentic RL”. Print/PDF uses
the selected page language. The source photograph is not duplicated on this text page.

Implementation: `_data/resume.yml` → `_pages/resume.html` → `_layouts/minimal.html`.
Local build evidence, source extraction, browser checks, and screenshots live in
the ignored `_preview/` directory. The preview uses the existing pinned Liquid and
Kramdown engines; it does not execute the full GitHub Pages plugin build.

Validation on 2026-10-21: English, Chinese, and Japanese each pass browser checks
at 1440, 390, and 320 px with no horizontal overflow. Language switching and the
Resume → homepage section → Resume round trip retain the selected language.
All three print exports contain only their selected language; key values and
dates survive extraction. The restored Chinese print layout was visually inspected.
The translations have matching sections, entries, nested projects, groups, and rows.
Browser checks also confirm that every localized data field actually renders.

Full-text audit on 2026-10-21:

- All 67 Chinese body text fields match the actual PDF after ignoring layout
  whitespace and typographic punctuation. Values, units, and methods are checked too.
- Reverse coverage of the PDF finds no omitted text other than the explicitly
  excluded Nature Communications review status. The scholarship's month is the
  owner's explicit refinement of the source's year.
- All 67 translatable fields have English and Japanese counterparts. Seven complete
  author/title/venue citations and all source links are identical across languages.
- Previously omitted PI harness, Auto Thinking, quality gates, data-processing
  details, and three-tier MemoMind model responsibilities are restored.

Reproduction aids and evidence: `_preview/restore_resume_full.py`,
`_preview/resume-{en,ja}-full.json`, `_preview/audit_full_resume.py`,
`_preview/resume-full-audit.json`, and `_preview/resume-verification.json`.
They operate on the unchanged source PDF/TeX and write only the web data or preview.
The earlier condensed implementation remains in git history, not as the current contract.
