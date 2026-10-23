import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { byDateAndAlphabetical } from "./PageList"
import style from "./styles/knowledgeBase.scss"

const RelatedNotes: QuartzComponent = ({ allFiles, fileData, cfg, displayClass }: QuartzComponentProps) => {
  if (!fileData.slug?.startsWith("blog/")) return null

  const currentTags = new Set(fileData.frontmatter?.tags ?? [])
  const blogPosts = allFiles.filter(
    (file) => file.slug?.startsWith("blog/") && file.slug !== fileData.slug,
  )

  let related = blogPosts
    .filter((file) => (file.frontmatter?.tags ?? []).some((tag) => currentTags.has(tag)))
    .sort(byDateAndAlphabetical(cfg))

  if (related.length < 5) {
    // Backfill with articles from the same section or latest articles
    const section = fileData.frontmatter?.section
    const backfill = blogPosts
      .filter((file) => !related.includes(file))
      .filter((file) => !section || file.frontmatter?.section === section)
      .sort(byDateAndAlphabetical(cfg))

    related = [...related, ...backfill].slice(0, 5)
  } else {
    related = related.slice(0, 5)
  }

  if (related.length === 0) return null

  return (
    <section class={`${displayClass ?? ""} more-like-this-card`}>
      <h3 class="more-like-this-title">MORE LIKE THIS</h3>
      <ul class="more-like-this-list">
        {related.map((note) => (
          <li>
            <a class="internal" href={resolveRelative(fileData.slug!, note.slug!)}>
              {note.frontmatter?.title ?? "Untitled note"}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

RelatedNotes.css = style

export default (() => RelatedNotes) satisfies QuartzComponentConstructor
