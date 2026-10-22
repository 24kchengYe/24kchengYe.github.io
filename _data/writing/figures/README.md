# Writing figures

`manifest.json` maps article assets to editable HTML/CSS or SVG sources. `translations.json` contains English and Japanese labels; Chinese stays in each source. Run `npm run build:writing` to rebuild all three languages and refresh article asset hashes.

## Typography

- `_tools/build-figures.cjs` defines fixed semantic type levels. HTML diagrams use 28px nodes, 24px secondary text, 22px annotations and 30px titles on a 1440px canvas. Existing CLI panels declare their own fixed scale with `data-fixed-type`.
- Native SVG diagrams use 18px node text, 15px secondary/chart labels and larger numeric callouts. Long translations wrap; glyphs are never compressed and individual labels are not shrunk.
- For SVG nodes, the builder expands rounded boxes as needed and reanchors connected path endpoints. Node IDs, path groups, branches, text and numeric values remain intact. Label offsets live in the source SVG.
- For HTML diagrams, reserve enough space in the source for the longest translation. When changing box geometry, adjust connected segments without changing `data-from` / `data-to` relationships. Preserve formulas, gates and branches.

## Review

The CLI article separates three views: `cli-harness-links.html` nests the shared Harness inside Online and distinguishes runtime use from planning, repair, and Offline handoff; `cli-rollout-environment.html` shows the runtime loop; `cli-case-format.html` expands a real inventory case into 15 physical model-response attempts and 13 retained turns. The two discarded attempts and two checkpoint restores remain visible; restores are control events, not additional model turns. Each row has action, response, and observed state. Keep `data-attempt`, `data-turn`, and `data-disposition` aligned with source evidence. Base A/B are aliases; never publish live tokens, URLs, paths, or raw reasoning.

This case's runtime schema exposes Bash, Read, Write, Edit, and present_files; its actual calls use only Read, Bash, and present_files. Broader online definitions (including Glob, Grep, TaskOutput, TaskStop, and TodoWrite) are not enabled by this batch. The walkthrough covers Online correction only and must not imply an Offline edit occurred on this trace. Code-error closure, business review, and training eligibility remain separate.

These use editable HTML/CSS with fixed 28px primary, 24px secondary and 22px annotation text. The dashed planning interface is the adopted design, distinct from the input-placement experiments. The arrowless dashed line denotes shared-runtime use, not a sequential stage. Pending is a common disposition outside both processing regions; Offline never automatically loops back to Online. Native tool-call / response pairing and actual archive status values remain documented in the article.

Check all three language variants at article width and in the image dialog. Inspect node overflow, label/box collisions, arrows, equations and mobile page width. Compare source text, graph identifiers and experimental tables before publishing. Generated SVGs are outputs; edit their sources and builders instead.
