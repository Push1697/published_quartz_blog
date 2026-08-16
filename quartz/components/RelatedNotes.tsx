import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { byDateAndAlphabetical } from "./PageList"
import style from "./styles/knowledgeBase.scss"

const RelatedNotes: QuartzComponent = ({ allFiles, fileData, cfg, displayClass }: QuartzComponentProps) => {
  if (!fileData.slug?.startsWith("blog/")) return null

  const currentTags = new Set(fileData.frontmatter?.tags ?? [])
  if (currentTags.size === 0) return null

  const related = allFiles
    .filter((file) => file.slug?.startsWith("blog/") && file.slug !== fileData.slug)
    .filter((file) => (file.frontmatter?.tags ?? []).some((tag) => currentTags.has(tag)))
    .sort(byDateAndAlphabetical(cfg))
    .slice(0, 5)

  if (related.length === 0) return null

  return (
    <section class={`${displayClass ?? ""} related-notes`}>
      <h3>Related notes</h3>
      <ul>
        {related.map((note) => (
          <li><a class="internal" href={resolveRelative(fileData.slug!, note.slug!)}>{note.frontmatter?.title ?? "Untitled note"}</a></li>
        ))}
      </ul>
    </section>
  )
}

RelatedNotes.css = style

export default (() => RelatedNotes) satisfies QuartzComponentConstructor
