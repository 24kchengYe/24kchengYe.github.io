# Writing figures

`manifest.json` maps article assets to editable HTML/CSS or SVG sources. `translations.json` contains English and Japanese labels; Chinese stays in each source. Run `npm run build:writing` to rebuild all three languages and refresh article asset hashes.

## Research workflows and recorded cases

`research-workflows.json` is the editable source for the six workflow/case diagrams in Spec generation, Judge–Fix and Rubric model, shared by Blog and Technical editions. It stores all three languages, node geometry, directed connections, article anchors and captions. `_tools/build-research-diagrams.cjs` generates HTML/CSS, per-figure translation dictionaries and explorer annotations before the ordinary figure build.

Keep the canvas brief: one action and one state per node. `nodeDetails` holds the checked explanation shown on selection; `notes` holds expandable figure notes. Linked nodes open their details first and offer the internal workflow from that panel. Primary text is 27px, secondary text 23px, annotations 21px; never shrink one label to fit a translation. Center node text horizontally and center the title/state group vertically. Keep diagram titles, captions and expanded prose left-aligned. Fit the canvas symmetrically in the viewport; tall width-fitted diagrams retain their top inset for scrolling.

Recorded evidence, verified without model calls:

- **Judge–Fix / Case 41:** Non-Table visit 2, round 1 selected candidate 2 and committed it. G kept seven-table administrator edits; K wrote seven `read` permissions. Both CodeAgent executions succeeded. Both documents failed release; downstream E2E passed G and failed K. This is a diagnostic execution, not publication of a failed document. The Permission Judge version was shared by G/K.
- **Spec / link50_007:** read the actual input Spec and tool calls in both saved trajectories, then each native E2E report. Q2’s pending/interviewed mismatch propagated into code. The continued-training configuration used scheduled-interview consistently. Native scores 5.5/10 and 10/10 are displayed as 55/100 and 100/100. Model and system prompt change together; this is not a PE-only causal comparison.
- **Rubric / unit `sft-v46-sample-dashboard-04911949078c8c229bc5`:** SFT-v48 and RL-v48 step80 have identical saved request messages and frozen Sol labels. Both identify two locations and fail the case. SFT uses `dashboard_business_filter_mismatch`; the reference and RL use `invalid_dashboard_source_reference`. The unique rubric/mode sets give per-unit F1 0 and 1. Repeated issue instances are not two distinct labels. Reference labels were not student inputs.

Run `node _tools/check-research-evidence.cjs /path/to/projectTest_1103` to recheck these claims against the twelve original artifacts. The local `_preview/research-evidence-audit.json` records source hashes and selectors; raw traces, Base tokens and service credentials are not copied to the site. Judge–Fix workflow uses the 2026-10-16 frozen pipeline map; its older case is a separate example. Rubric training branches use Train only; frozen Test enters evaluation, with Sol and DeepSeek results reported separately.

`npm run check:writing-maps` checks all translated interactive views, new node/label bounds, connections, drill-down, mobile layout, fullscreen and static fallbacks. Existing experiment tables and earlier diagrams remain unchanged.

## Typography

- `_tools/build-figures.cjs` defines fixed semantic type levels. HTML diagrams use 28px nodes, 24px secondary text, 22px annotations and 30px titles on a 1440px canvas. Existing CLI panels declare their own fixed scale with `data-fixed-type`.
- Native SVG diagrams use 18px node text, 15px secondary/chart labels and larger numeric callouts. Long translations wrap; glyphs are never compressed and individual labels are not shrunk.
- For SVG nodes, the builder expands rounded boxes as needed and reanchors connected path endpoints and arrowheads. Unboxed nodes reserve text-sized ports too. Node IDs, path groups, branches, text and numeric values remain intact. `vector-layouts.json` stores shared multilingual annotation centers and wrapping widths; coordinates refer to the source SVG viewBox. Reserve space outside both nodes and connectors, including the longest translation. The entrance router has extra vertical space for its release-vote branch.
- For HTML diagrams, reserve enough space in the source for the longest translation. When changing box geometry, adjust connected segments without changing `data-from` / `data-to` relationships. Preserve formulas, gates and branches.

## Review

The CLI article separates the shared execution model from one concrete case: `cli-harness-links.html` places the shared Harness beneath Online and shows bounded Offline return; `cli-rollout-environment.html` shows the runtime loop; `cli-trajectory-model.html` abstracts one action–observation–state transition; `cli-case-format.html` follows a real inventory case along a retained-turn timeline. Its 15 physical attempts include two failed side branches: checkpoint → failed attempt → teacher guidance / Harness restore → the same checkpoint → re-execution. Dashed arrows mean rewind, not parallel execution. All 15 events retain their action, response, and observed state; restores are control events, not model turns. Keep `data-attempt`, `data-turn`, `data-disposition`, and connection `data-from/to/relation` aligned with source evidence. Base A/B are aliases; never publish live tokens, URLs, paths, or raw reasoning.

`cli-case-format.html` uses the companion `cli-case-format-overrides.css` during localization to keep ordinary turns on a light rail while reserving stronger color for failed and repaired attempts; the event payload is unchanged.

This case's runtime schema exposes Bash, Read, Write, Edit, and present_files; its actual calls use only Read, Bash, and present_files. Broader online definitions (including Glob, Grep, TaskOutput, TaskStop, and TodoWrite) are not enabled by this batch. The walkthrough covers Online correction only and must not imply an Offline edit occurred on this trace. Code-error closure, business review, and training eligibility remain separate.

These use editable HTML/CSS with fixed 28px primary, 24px secondary and 22px annotation text. The dashed planning interface is the adopted design, distinct from the input-placement experiments. The arrowless dashed line denotes shared-runtime use, not a sequential stage. Pending is a common disposition outside both processing regions. When Offline discovers an issue that requires real execution, it returns the issue and evidence to Online under the same cumulative case budget; unknown dependencies and other release failures remain Pending. Native tool-call / response pairing and actual archive status values remain documented in the article.

Check all three language variants at article width and in the image dialog. Inspect node overflow, label/box collisions, arrows, equations and mobile page width. Compare source text, graph identifiers and experimental tables before publishing. Generated SVGs are outputs; edit their sources and builders instead.

## Interactive presentation

Use clear thin borders, a white canvas and one restrained accent. Keep one current-view title in the selector; breadcrumbs show navigation history only. Hide duplicate panel headings only after the interactive diagram is ready. Preserve substantive captions, static figures and print output. The `?` control reveals reading help on demand. Node selection opens the detailed explanation without repeating its heading. Hover tracing, related-diagram navigation, zoom, fullscreen and optional connection animation remain available.

`check-writing-maps.cjs` also checks native SVG text against other labels, node boundaries and sampled connector paths in all three languages. Rendering tests preserve the source text, values and directed edge identities; visual simplification must not change the computational or experimental flow.
