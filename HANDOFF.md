# Handoff — 2026-08-16

## Current status

The Quartz knowledge base has been rebuilt around clean public blog URLs and a wiki-style navigation model. The implementation is complete and the working tree was clean after commit `95435ba`.

The latest GitHub Pages deployment was queued as workflow run `31932239989` when last checked. A later status check from the local sandbox could not reach the GitHub API; confirm the run is green before considering the deployment fully live.

## What changed

### Public publishing workflow

- Public notes now require both `publish: true` and `garden: true`.
- `publish-garden` generates a copy of every selected note under `content/blog/`.
- Public URLs no longer reveal vault folders such as `0-inbox` or `3-Resources`.
- Example: the Microsoft 365/cPanel article is now served from:
  - `/blog/split-delivery-between-microsoft-365-and-cpanel`
- The publisher assigns a section automatically:
  - `Troubleshooting`
  - `Runbooks`
  - `Guides`
  - `Reference`
  - `Foundations`
- Source notes may override automatic grouping with frontmatter such as `section: Runbooks`.
- The version-controlled publisher is [scripts/publish-garden](scripts/publish-garden). The global `publish-garden` command delegates to it.

### Quartz UI

- Added a dark-first, documentation-wiki visual treatment inspired by the supplied reference site.
- Replaced the old folder-oriented navigation with a grouped knowledge-base sidebar.
- Added homepage listing of **all** published notes, grouped by section.
- Added right-side graph view, latest articles, related notes, and table of contents.
- Added these custom components:
  - `quartz/components/KnowledgeNav.tsx`
  - `quartz/components/PublishedNotes.tsx`
  - `quartz/components/RelatedNotes.tsx`
  - `quartz/components/styles/knowledgeBase.scss`
- Added a new theme storage key, `overflowbyte-wiki-theme`, to ensure existing visitors receive the dark default once without permanently disabling their theme preference.

## Validation completed

- `publish-garden --dry-run` verified that all nine public notes are emitted as clean `/blog/...` paths and the old public folder paths are deleted.
- `publish-garden` completed the content migration and production Quartz build successfully.
- `npm run quartz -- build` passed after the UI and theme changes.

## Recent commits

| Commit | Summary |
| --- | --- |
| `a80916f` | Restyle garden as documentation wiki |
| `c895167` | Publish notes through clean blog knowledge base |
| `95435ba` | Default existing visitors to wiki dark theme |

## Recommended next action

After GitHub Pages reports success, open the homepage in a private/incognito window and verify:

1. The dark wiki theme loads.
2. All notes appear under the grouped homepage sections.
3. The left navigation lists the same sections and individual notes.
4. New article URLs begin with `/blog/` and old `/0-inbox/` or `/3-Resources/` URLs are no longer primary public paths.
