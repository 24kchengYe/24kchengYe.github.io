# Writing editorial rules

- Explain the work directly. Remove notes about converting reports, reading chats, matching source figures, and producing translations.
- Keep experimental conditions, sample counts, model and Judge settings, evaluation units, and distinctions between measurements and proposed designs.
- Retain relevant public paper citations beside the claims they support. Internal document links and local file paths do not belong in the public article.
- Put historical PE identifiers in a collapsed version appendix. Describe snapshot dates briefly when needed to distinguish implementations.
- Expose editable figures and interaction code through one collapsed “Figures and code” entry at the end of each article. Do not repeat source controls under individual figures.
- Update Chinese, English, and Japanese together. Diagram content, topology, and experiment tables must remain unchanged during editorial cleanup.

## Validation

Run `npm run build:writing`, `npm run check:writing-editorial`, and `npm run check:diagram-themes`. Preview desktop and mobile pages in all three languages before publishing; check the source entry, language switching, and both diagram styles.
