# Automation blueprint writing

The collapsed More writing entry links to `/writing/automation-blueprint/`.
It is a project reading of Jerry’s workspace automation blueprint, not a claim
that the homepage author built or deployed that system.

## Editable sources

- `_data/writing/automation-blueprint.html` and `.json`: article and translations.
- `_data/writing/automation-blueprint/graph.json`: observed source views, nodes,
  exact SVG paths, edge conditions, annotations and related-view destinations.
- `_data/writing/automation-blueprint/translations.json`: graph and control labels.
- `assets/js/automation-blueprint.js`: independent read-only HTML/SVG renderer.
- `assets/css/automation-blueprint.css`: article-scoped palette and layout.

Build only this article with `npm run build:writing -- automation-blueprint`.
The builder validates references and translation coverage, then generates the
same-origin data script and article. This command does not rebuild other figures.

## Fidelity and interaction

The overview preserves 22 nodes and 24 connections, including the direct MR→CI
route, CI/review repair loops, risk approval, human escalation and recovery.
The source has 58 captured module/leaf views in addition to the overview.
The original coordinates receive a shared horizontal/vertical layout scale;
node identities, SVG path commands, edge endpoints and conditions stay unchanged.
Standalone annotations such as rejected approval and the timer caveat stay visible.
Relations between modules remain navigable, including leaf-level relationships.

Click nodes to drill down, follow breadcrumbs or related flows, hover/focus to
trace connections, select an edge to retain its highlight, drag to pan, and use
zoom, fit or expanded-view controls. Keyboard users can navigate nodes, pan with
arrow keys, zoom with +/−, reset with 0 and close the expanded canvas with Escape.
The `view` query parameter supports direct links and browser back/forward.
Changing language translates the current view without changing its structure.

This is a local read-only diagram: it makes no API calls, embeds no private host
and cannot trigger the source project’s development or release operations.
The original blueprint’s open risk/timer/retry/rollback details are retained.
Raw DOM captures and publication checks are kept in ignored
`_preview/automation-blueprint/`, outside the public site.
