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
  afterBody: [Component.ShelfPreview()],
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
    Component.TagList(),
  ],
  left: [
    Component.GardenNav(),
  ],
  right: [
    Component.Graph({
      localGraph: { depth: 1, scale: 1, repelForce: 0.5, linkDistance: 30 },
    }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.GardenNav(),
  ],
  right: [],
}
