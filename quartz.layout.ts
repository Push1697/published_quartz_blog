import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.Flex({
      components: [
        { Component: Component.PageTitle(), grow: true },
        { Component: Component.Search({ enablePreview: false }), grow: true, basis: "16rem" },
        { Component: Component.Darkmode() },
      ],
      gap: "1rem",
    }),
  ],
  afterBody: [
    // "what next" belongs after the article, not before it
    Component.SeriesNav({ mode: "footer" }),
    Component.PublishedNotes(),
  ],
  footer: Component.Footer({
    links: {
      Portfolio: "https://pushpendra.overflowbyte.cloud",
      Blog: "https://blog.overflowbyte.cloud",
      GitHub: "https://github.com/push1697",
      LinkedIn: "https://linkedin.com/in/pushpendra16",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    // orientation first: where am I in the reading order? Renders only on notes
    // that declare a series.
    Component.SeriesNav({ mode: "header" }),
    Component.TagList(),
  ],
  left: [
    Component.KnowledgeNav(),
  ],
  right: [
    // on a long article the table of contents is the most-used control, so it
    // leads. The rest is exploration, and sits below the fold happily.
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Graph({
      localGraph: { depth: 1, scale: 1, repelForce: 0.5, linkDistance: 30 },
    }),
    // a note inside a series already has ordered prev/next and a full contents
    // list, so "related" would only repeat it — show it for standalone notes.
    Component.ConditionalRender({
      component: Component.RelatedNotes(),
      condition: (page) => typeof page.fileData.frontmatter?.series !== "string",
    }),
    Component.Backlinks(),
    // recency belongs on the front page, not beside every article
    Component.ConditionalRender({
      component: Component.RecentNotes({
        title: "Recently updated",
        limit: 5,
        showTags: false,
        filter: (file) => file.slug?.startsWith("blog/") ?? false,
      }),
      condition: (page) => page.fileData.slug === "index",
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.KnowledgeNav(),
  ],
  right: [],
}
