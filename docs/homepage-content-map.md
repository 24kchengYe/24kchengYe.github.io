# Homepage / Resume content ownership

The owner requested a shorter homepage while keeping the complete trilingual
Resume and every homepage-only record. Baseline: `f942535` (2026-10-21).
No Resume body, translations, print stylesheet, or print script changed in this pass.

| Content | Homepage | Resume |
| --- | --- | --- |
| ByteDance | Company, role, dates; contextual Resume link | Complete three-part account and all results |
| Nanjing practice | Corrected institution name; original detailed experiments remain expandable in all three languages | Original CV account remains unchanged |
| Education | Existing profile introduction; former education anchor leads to the Resume link | Complete original education entries |
| Research overview | Research introduction and vision | Publication/download statistics and complete CV narrative |
| Awards and talks | Latest News plus one dated archive; duplicate background lists removed | Complete original CV honors and activities |
| Reviewer history | Six journals retain their original start years, invited status, and publisher affiliations, grouped into three localized rows | Complete original reviewer list |
| Papers, projects, reading, datasets | Existing content retained unchanged | Complete source CV content |

Before removing the duplicate background lists, the dated archive was supplemented
with the teaching-assistant semester, the 29th Academic Rising Star nomination,
and the GIS session speaker role where these details had not been explicit.
Each language keeps 31 News records; the only removed News item is the obsolete
Nature Communications second-review announcement, as explicitly requested.
Nanjing's institution name now matches the source CV in all three languages.

Primary navigation: Writing, Research, Projects, Reading, Resume. Legacy honors
and talks bookmarks open the dated archive; education bookmarks reach the Resume
link. The original source and retention manifest are in ignored `_preview/` files.

Validation: `_preview/verify_home_streamline.py` checks unchanged Resume hashes,
unchanged research/project/reading/vision/dataset blocks, exact retained weather
details, News retention, and all six reviewer histories. Browser evidence is in
`_preview/home-streamline-browser.json`: all three languages at 1440/390/320 px,
five navigation items, contextual Resume round trips, and legacy bookmarks.
This is content consolidation, not a new audit of the retained historical research
claims. `Guide: no material change`.
