# Writing figure styles

Every article has one style picker in the top-right page navigation, next to the language buttons. It controls every interactive diagram and static figure on that page. `writing-diagram-style` stores the reader's choice across articles and tabs; OpenAI Blog is the default. Diagram toolbars contain navigation, zoom and playback controls only.

| | OpenAI Blog | Engineering |
|---|---|---|
| Presentation | Editorial illustration with restrained texture and feedback accents | Minimal engineering schematic with explicit boundaries |
| Surface | White; light stippling inside selected regions only | Pure white, no grid or texture |
| Nodes | Rounded outlines; selected nodes use faint dots and soft color | Plain white nodes, small corners, no shadows or header strips |
| Groups | Fine boundaries and subtle neutral stippling | White groups with simple gray boundaries |
| Controls | Quiet text controls | Boxed controls on a distinct toolbar |
| Status | Green feedback and warm failure accents | Restrained line accents; no colored node fills |

The two styles share the same text, numerical results, graph topology and layout geometry. Theme changes must preserve the current view, selected node, replay cursor and camera. Do not turn semantic shapes or state colors into arbitrary decorations. Charts retain their original encodings.

Keep node text legible. OpenAI Blog uses generated low-opacity dots (radius 0.45, opacity 0.24, 5-unit spacing), not the dense imported pattern; Engineering uses solid white fills. Texture never covers the whole canvas. Chart encodings are preserved. Original SVG definitions (patterns, clip paths, markers) must not receive node/connector theme attributes. When translated text expands a composite SVG node, resize its fill and separate outline together. Explicit `frame` entries in `vector-layouts.json` give process and output nodes a visible boundary without boxing edge labels or adding workflow steps. Regression checks cover texture density, node frames and paired outlines.

## Source files

- `assets/js/writing-diagram-style.js`: page picker, persistence, language labels and global events.
- `assets/css/writing-language.css`: sticky navigation and responsive style menu.
- `assets/css/writing-diagram-themes.css`: diagram and workbench visual systems.
- `_tools/figure-themes.cjs`: generates both static SVG variants from the same source.
- `assets/js/trajectory-map.js` and `assets/js/automation-blueprint.js`: interactive renderers subscribed to global changes.

Run `npm run build:writing` and `npm run check:diagram-themes`. Review the rendered pages in Chinese, English and Japanese at desktop and mobile widths. Check the Code Agent case replay as well as ordinary workflows; verify the single picker, menu fit, language changes, cross-page persistence, expanded diagrams and unchanged replay position.
