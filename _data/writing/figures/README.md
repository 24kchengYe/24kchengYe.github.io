# Writing figures

`manifest.json` maps article assets to editable HTML/CSS or SVG sources. `translations.json` contains English and Japanese labels; Chinese stays in each source. Run `npm run build:writing` to rebuild all three languages and refresh article asset hashes.

## Typography

- `_tools/build-figures.cjs` defines fixed semantic type levels. HTML diagrams use 28px nodes, 24px secondary text, 22px annotations and 30px titles on a 1440px canvas. Existing CLI panels declare their own fixed scale with `data-fixed-type`.
- Native SVG diagrams use 18px node text, 15px secondary/chart labels and larger numeric callouts. Long translations wrap; glyphs are never compressed and individual labels are not shrunk.
- For SVG nodes, the builder expands rounded boxes as needed and reanchors connected path endpoints. Node IDs, path groups, branches, text and numeric values remain intact. Label offsets live in the source SVG.
- For HTML diagrams, reserve enough space in the source for the longest translation. When changing box geometry, adjust connected segments without changing `data-from` / `data-to` relationships. Preserve formulas, gates and branches.

## Review

Check all three language variants at article width and in the image dialog. Inspect node overflow, label/box collisions, arrows, equations and mobile page width. Compare source text, graph identifiers and experimental tables before publishing. Generated SVGs are outputs; edit their sources and builders instead.
