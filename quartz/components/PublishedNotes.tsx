import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { byDateAndAlphabetical } from "./PageList"
import { seriesOf, orderOf, groupParts, partsOf } from "./SeriesNav"
import style from "./styles/knowledgeBase.scss"

const sectionOrder = ["Troubleshooting", "Runbooks", "Guides", "Reference", "Foundations", "Articles"]

const publishedNotes = (allFiles: QuartzPluginData[]) =>
  allFiles.filter((file) => file.slug?.startsWith("blog/"))

const sectionFor = (file: QuartzPluginData) =>
  typeof file.frontmatter?.section === "string" ? file.frontmatter.section : "Articles"

const sectionId = (section: string) => `published-${section.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`

const titleOf = (file: QuartzPluginData) => file.frontmatter?.title ?? "Untitled note"

const PublishedNotes: QuartzComponent = ({ allFiles, fileData, cfg, displayClass }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null

  const notes = publishedNotes(allFiles)
  const seriesNames = [...new Set(notes.map(seriesOf).filter((s): s is string => !!s))].sort()
  const standalone = notes.filter((n) => !seriesOf(n)).sort(byDateAndAlphabetical(cfg))
  const sections = [
    ...sectionOrder,
    ...standalone.map(sectionFor).filter((s) => !sectionOrder.includes(s)),
  ]

  return (
    <section class={`${displayClass ?? ""} published-notes`} id="published-notes">
      <div class="knowledge-section-heading">
        <p>Knowledge base</p>
        <h2>Everything here</h2>
        <span>
          {notes.length} note{notes.length === 1 ? "" : "s"}
          {seriesNames.length > 0 &&
            ` · ${seriesNames.length} series · ${standalone.length} standalone`}
        </span>
      </div>

      {/* A series is a reading order, so it is listed as one — not scattered
          alphabetically through the sections below. */}
      {seriesNames.map((name) => {
        const parts = partsOf(notes, name)
        const first = parts[0]
        return (
          <section class="published-series" id={sectionId(name)}>
            <div class="published-series-head">
              <div>
                <p class="published-series-kicker">Series · {parts.length} parts</p>
                <h3>{name}</h3>
                {first?.frontmatter?.description && (
                  <p class="published-series-blurb">{String(first.frontmatter.description)}</p>
                )}
              </div>
              {first && (
                <a class="published-series-cta internal" href={resolveRelative(fileData.slug!, first.slug!)}>
                  Start reading →
                </a>
              )}
            </div>
            <ol class="published-series-list">
              {groupParts(parts).map((g) => (
                <>
                  {g.label && <li class="published-series-group">{g.label}</li>}
                  {g.items.map((part) => (
                    <li>
                      <a class="internal" href={resolveRelative(fileData.slug!, part.slug!)}>
                        <span class="published-series-num">{orderOf(part)}</span>
                        <span class="published-series-title">{titleOf(part)}</span>
                      </a>
                    </li>
                  ))}
                </>
              ))}
            </ol>
          </section>
        )
      })}

      {sections.map((section) => {
        const sectionNotes = standalone.filter((note) => sectionFor(note) === section)
        if (sectionNotes.length === 0) return null

        return (
          <section class="published-section" id={sectionId(section)}>
            <h3>
              {section}
              <span class="published-section-count">{sectionNotes.length}</span>
            </h3>
            <div class="published-grid">
              {sectionNotes.map((note) => {
                const tags = note.frontmatter?.tags ?? []
                return (
                  <a class="published-note internal" href={resolveRelative(fileData.slug!, note.slug!)}>
                    <span class="published-note-meta">
                      {note.dates && <Date date={getDate(cfg, note)!} locale={cfg.locale} />}
                    </span>
                    <strong>{titleOf(note)}</strong>
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
