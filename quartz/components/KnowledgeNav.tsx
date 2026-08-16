import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { resolveRelative } from "../util/path"
import style from "./styles/knowledgeBase.scss"

const sectionOrder = ["Troubleshooting", "Runbooks", "Guides", "Reference", "Foundations", "Articles"]

const sectionFor = (file: QuartzPluginData) =>
  typeof file.frontmatter?.section === "string" ? file.frontmatter.section : "Articles"

const anchorFor = (section: string) => `published-${section.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`

const KnowledgeNav: QuartzComponent = ({ allFiles, fileData, displayClass }: QuartzComponentProps) => {
  const notes = allFiles
    .filter((file) => file.slug?.startsWith("blog/"))
    .sort((a, b) => (a.frontmatter?.title ?? "").localeCompare(b.frontmatter?.title ?? ""))
  const sections = [...sectionOrder, ...notes.map(sectionFor).filter((s) => !sectionOrder.includes(s))]

  return (
    <nav class={`${displayClass ?? ""} knowledge-nav`} aria-label="Knowledge base navigation">
      <ul class="knowledge-primary">
        <li><a href="/" class={fileData.slug === "index" ? "active" : ""}>🏠 <span>Home</span></a></li>
        <li><a href="/#published-notes">📝 <span>All articles</span></a></li>
        <li><a href="/#graph-view">🕸️ <span>Graph view</span></a></li>
      </ul>
      <p class="knowledge-nav-label">Notes</p>
      <div class="knowledge-groups">
        {sections.map((section) => {
          const sectionNotes = notes.filter((note) => sectionFor(note) === section)
          if (sectionNotes.length === 0) return null
          return (
            <details open>
              <summary>{section}</summary>
              <ul>
                {sectionNotes.map((note) => (
                  <li>
                    <a class="internal" href={resolveRelative(fileData.slug!, note.slug!)}>
                      {note.frontmatter?.title ?? "Untitled note"}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )
        })}
      </div>
    </nav>
  )
}

KnowledgeNav.css = style

export default (() => KnowledgeNav) satisfies QuartzComponentConstructor
