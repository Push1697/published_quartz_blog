import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { byDateAndAlphabetical } from "./PageList"
import style from "./styles/knowledgeBase.scss"

const sectionOrder = ["Troubleshooting", "Runbooks", "Guides", "Reference", "Foundations", "Articles"]

const publishedNotes = (allFiles: QuartzPluginData[]) =>
  allFiles.filter((file) => file.slug?.startsWith("blog/"))

const sectionFor = (file: QuartzPluginData) =>
  typeof file.frontmatter?.section === "string" ? file.frontmatter.section : "Articles"

const sectionId = (section: string) => `published-${section.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`

const PublishedNotes: QuartzComponent = ({ allFiles, fileData, cfg, displayClass }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null

  const notes = publishedNotes(allFiles).sort(byDateAndAlphabetical(cfg))
  const sections = [...sectionOrder, ...notes.map(sectionFor).filter((s) => !sectionOrder.includes(s))]

  return (
    <section class={`${displayClass ?? ""} published-notes`} id="published-notes">
      <div class="knowledge-section-heading">
        <p>Knowledge base</p>
        <h2>Published notes</h2>
        <span>{notes.length} note{notes.length === 1 ? "" : "s"} available</span>
      </div>
      {sections.map((section) => {
        const sectionNotes = notes.filter((note) => sectionFor(note) === section)
        if (sectionNotes.length === 0) return null

        return (
          <section class="published-section" id={sectionId(section)}>
            <h3>{section}</h3>
            <div class="published-grid">
              {sectionNotes.map((note) => {
                const title = note.frontmatter?.title ?? "Untitled note"
                const tags = note.frontmatter?.tags ?? []
                return (
                  <a class="published-note internal" href={resolveRelative(fileData.slug!, note.slug!)}>
                    <span class="published-note-meta">
                      {note.dates && <Date date={getDate(cfg, note)!} locale={cfg.locale} />}
                    </span>
                    <strong>{title}</strong>
                    {tags.length > 0 && <span class="published-note-tags">{tags.slice(0, 3).join(" · ")}</span>}
                  </a>
                )
              })}
            </div>
          </section>
        )
      })}
    </section>
  )
}

PublishedNotes.css = style

export default (() => PublishedNotes) satisfies QuartzComponentConstructor
