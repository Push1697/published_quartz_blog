import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.PageTitle(),
    Component.TopNav(),
    Component.Search({ enablePreview: false }),
    Component.Darkmode(),
  ],
  afterBody: [
    Component.SeriesNav({ mode: "footer" }),
    Component.PublishedNotes(),
  ],
  footer: Component.Footer({
    links: {
      "Start Here": "/blog/rhcsa-to-rhce-a-60-day-lab-curriculum",
      "Guides": "/#published-guides",
      "Series": "/#published-series",
      "Cheatsheets": "/#published-reference",
      "GitHub": "https://github.com/push1697",
      "LinkedIn": "https://linkedin.com/in/pushpendra16",
      "RSS": "/index.xml",
    },
  }),
}

// components for pages that display a single page (e.g. a single note / article)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.SeriesNav({ mode: "header" }),
    Component.ConditionalRender({
      component: Component.TagList(),
      condition: (page) => page.fileData.slug !== "index",
    }),
  ],
  left: [
    // On article pages, Table of Contents ("ON THIS PAGE") sits on the left column
    Component.ConditionalRender({
      component: Component.DesktopOnly(Component.TableOfContents()),
      condition: (page) => page.fileData.slug !== "index",
    }),
  ],
  right: [
    // On article pages, Related Notes ("MORE LIKE THIS") sits on the right column
    Component.ConditionalRender({
      component: Component.DesktopOnly(Component.RelatedNotes()),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.DesktopOnly(Component.Backlinks()),
      condition: (page) => page.fileData.slug !== "index",
    }),
  ],
}

// components for pages that display lists of pages (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.DesktopOnly(Component.KnowledgeNav()),
  ],
  right: [],
}
