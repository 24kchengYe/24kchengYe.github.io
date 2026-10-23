# Writing figure styles

Every article has one style picker in the top-right page navigation, next to the language buttons. It controls every interactive diagram and static figure on that page. `writing-diagram-style` stores the reader's choice across articles and tabs; OpenAI Blog is the default. Diagram toolbars contain navigation, zoom and playback controls only.

| | OpenAI Blog | Engineering |
|---|---|---|
| Presentation | Editorial illustration integrated into the article | Bounded workbench with a persistent toolbar |
| Surface | White, no canvas grid | Cool neutral dot grid |
| Nodes | Flat, small-radius outlines; selected groups use sparse stippling | Rounded, elevated cards with an inset header strip |
| Groups | Light, flat boundaries | Tinted containers with explicit separation |
| Controls | Quiet text controls | Boxed controls on a distinct toolbar |
| Status | Restrained green / warm accents | Consistent state accents and card strips |

The two styles share the same text, numerical results, graph topology and layout geometry. Theme changes must preserve the current view, selected node, replay cursor and camera. Do not turn semantic shapes or state colors into arbitrary decorations. Charts retain their original encodings.

## Source files

- `assets/js/writing-diagram-style.js`: page picker, persistence, language labels and global events.
- `assets/css/writing-language.css`: sticky navigation and responsive style menu.
- `assets/css/writing-diagram-themes.css`: diagram and workbench visual systems.
- `_tools/figure-themes.cjs`: generates both static SVG variants from the same source.
- `assets/js/trajectory-map.js` and `assets/js/automation-blueprint.js`: interactive renderers subscribed to global changes.

Run `npm run build:writing` and `npm run check:diagram-themes`. Review the rendered pages in Chinese, English and Japanese at desktop and mobile widths. Check the Code Agent case replay as well as ordinary workflows; verify the single picker, menu fit, language changes, cross-page persistence, expanded diagrams and unchanged replay position.
