import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { resolveRelative } from "../util/path"
import { seriesOf, orderOf, groupParts } from "./SeriesNav"
import style from "./styles/knowledgeBase.scss"

const sectionOrder = ["Troubleshooting", "Runbooks", "Guides", "Reference", "Foundations", "Articles"]

const sectionFor = (file: QuartzPluginData) =>
  typeof file.frontmatter?.section === "string" ? file.frontmatter.section : "Articles"

const titleOf = (file: QuartzPluginData) => file.frontmatter?.title ?? "Untitled note"

const KnowledgeNav: QuartzComponent = ({ allFiles, fileData, displayClass }: QuartzComponentProps) => {
  const notes = allFiles.filter((file) => file.slug?.startsWith("blog/"))

  // A series is navigated in order, as one thing. Everything else is browsed by
  // section. Mixing the two is what made this list unreadable.
  const seriesNames = [...new Set(notes.map(seriesOf).filter((s): s is string => !!s))].sort()
  const standalone = notes
    .filter((n) => !seriesOf(n))
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))

  const sections = [
    ...sectionOrder,
    ...standalone.map(sectionFor).filter((s) => !sectionOrder.includes(s)),
  ]

  const currentSeries = seriesOf(fileData)
  const currentSection = sectionFor(fileData)
  const here = (note: QuartzPluginData) => note.slug === fileData.slug

  return (
    <nav class={`${displayClass ?? ""} knowledge-nav`} aria-label="Knowledge base navigation">
      <ul class="knowledge-primary">
        <li>
          <a href="/" class={fileData.slug === "index" ? "active" : ""}>
            <span class="kn-icon">🏠</span>
            <span>Home</span>
          </a>
        </li>
        <li>
          <a href="/#published-notes">
            <span class="kn-icon">📚</span>
            <span>All notes</span>
            <span class="kn-count">{notes.length}</span>
          </a>
        </li>
        <li>
          <a href="/tags/">
            <span class="kn-icon">🏷️</span>
            <span>Topics</span>
          </a>
        </li>
        <li>
          <a href="/#graph-view">
            <span class="kn-icon">🕸️</span>
            <span>Graph</span>
          </a>
        </li>
      </ul>

      {seriesNames.length > 0 && <p class="knowledge-nav-label">Series</p>}
      {seriesNames.length > 0 && (
        <div class="knowledge-groups">
          {seriesNames.map((name) => {
            const parts = notes
              .filter((n) => seriesOf(n) === name)
              .sort((a, b) => orderOf(a) - orderOf(b))
            const active = currentSeries === name
            return (
              <details class="kn-series" open={active}>
                <summary>
                  <span>{name}</span>
                  <span class="kn-count">{parts.length}</span>
                </summary>
                <ol class="kn-series-list">
                  {groupParts(parts).map((g) => (
                    <>
                      {g.label && <li class="kn-series-group">{g.label}</li>}
                      {g.items.map((part) => (
                        <li class={here(part) ? "active" : ""}>
                          <a
                            class="internal"
                            href={resolveRelative(fileData.slug!, part.slug!)}
                            aria-current={here(part) ? "page" : undefined}
                          >
                            <span class="kn-num">{orderOf(part)}</span>
                            <span>{titleOf(part)}</span>
                          </a>
                        </li>
                      ))}
                    </>
                  ))}
                </ol>
              </details>
            )
          })}
        </div>
      )}

      {standalone.length > 0 && (
        <>
          <p class="knowledge-nav-label">Notes by topic</p>
          <div class="knowledge-groups">
            {sections.map((section) => {
              const sectionNotes = standalone.filter((note) => sectionFor(note) === section)
              if (sectionNotes.length === 0) return null
              // open the section you are reading from; keep the rest tucked away
              const active = !currentSeries && currentSection === section
              return (
                <details open={active}>
                  <summary>
                    <span>{section}</span>
                    <span class="kn-count">{sectionNotes.length}</span>
                  </summary>
                  <ul>
                    {sectionNotes.map((note) => (
                      <li class={here(note) ? "active" : ""}>
                        <a
                          class="internal"
                          href={resolveRelative(fileData.slug!, note.slug!)}
                          aria-current={here(note) ? "page" : undefined}
                        >
                          {titleOf(note)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )
            })}
          </div>
        </>
      )}
    </nav>
  )
}

KnowledgeNav.css = style

export default (() => KnowledgeNav) satisfies QuartzComponentConstructor
