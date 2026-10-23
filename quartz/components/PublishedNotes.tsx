import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { getDate } from "./Date"
import { byDateAndAlphabetical } from "./PageList"
import { seriesOf, partsOf } from "./SeriesNav"
import readingTime from "reading-time"
import style from "./styles/knowledgeBase.scss"
import { GlobalConfiguration } from "../cfg"

const publishedNotes = (allFiles: QuartzPluginData[]) =>
  allFiles.filter((file) => file.slug?.startsWith("blog/"))

const titleOf = (file: QuartzPluginData) => file.frontmatter?.title ?? "Untitled note"

const getReadTime = (note: QuartzPluginData) => {
  const { minutes } = readingTime(note.text ?? "")
  return `${Math.ceil(minutes)} min read`
}

const getDateString = (note: QuartzPluginData, cfg: GlobalConfiguration) => {
  const d = getDate(cfg, note)
  if (!d) return "Recent"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const getExcerpt = (note: QuartzPluginData) => {
  if (note.frontmatter?.description) return String(note.frontmatter.description)
  const text = (note.text ?? "")
    .replace(/^---[\s\S]*?---/, "")
    .replace(/#+\s+.*?\n/g, "")
    .replace(/\n+/g, " ")
    .trim()
  return text.slice(0, 160) + "..."
}

const renderThumbnail = (note: QuartzPluginData) => {
  if (note.frontmatter?.image) {
    return (
      <img
        src={String(note.frontmatter.image)}
        alt={titleOf(note)}
        class="card-thumb-img"
        loading="lazy"
      />
    )
  }
  const tags = (note.frontmatter?.tags ?? []) as string[]
  const primaryTag = tags[0] ?? "linux"
  return (
    <div class={`card-thumb-fallback tag-theme-${primaryTag}`}>
      <div class="thumb-badge">
        <svg role="img" aria-hidden="true" class="thumb-terminal-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-2-1h-6v-2h6v2zM7.5 17l-1.4-1.4 3.6-3.6-3.6-3.6L7.5 7l5 5-5 5z"/>
        </svg>
        <span class="thumb-tag-text">{primaryTag.toUpperCase()}</span>
      </div>
    </div>
  )
}

const PublishedNotes: QuartzComponent = ({
  allFiles,
  fileData,
  cfg,
  displayClass,
}: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null

  const notes = publishedNotes(allFiles)
  const seriesNames = [...new Set(notes.map(seriesOf).filter((s): s is string => !!s))].sort()

  // Featured: top 3 hand-picked or guides
  const featured = [
    notes.find((n) => n.slug?.includes("three-node-rhel-lab-on-kvm")),
    notes.find((n) => n.slug?.includes("rhcsa-to-rhce-a-60-day-lab-curriculum")),
    notes.find((n) => n.slug?.includes("deep-dive-managing-apt-repository")),
  ]
    .filter((n): n is QuartzPluginData => !!n)
    .slice(0, 3)

  // Latest articles (excluding featured from top spots if desired, or all sorted by date)
  const latest = notes.sort(byDateAndAlphabetical(cfg)).slice(0, 8)

  // Cheatsheets
  const cheatsheets = notes
    .filter(
      (n) =>
        n.frontmatter?.section === "Reference" ||
        (n.frontmatter?.tags ?? []).some((t: string) => t.includes("cheat")),
    )
    .slice(0, 4)

  return (
    <div class={`${displayClass ?? ""} overflowbyte-home-sections`}>
      {/* Featured Articles Section */}
      <section class="home-section" id="featured-articles">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <h2 class="section-title">Featured Articles</h2>
          </div>
        </div>
        <div class="featured-cards-grid">
          {featured.map((note) => {
            const url = resolveRelative(fileData.slug!, note.slug!)
            return (
              <a href={url} class="featured-card group">
                <div class="card-thumb-wrapper">{renderThumbnail(note)}</div>
                <div class="card-body">
                  <div class="card-meta">
                    <svg role="img" aria-hidden="true" class="meta-icon" viewBox="0 0 22 22">
                      <path d="M11 22A11 11 0 1122 11 11 11 0 0111 22zM11 2a9 9 0 109 9A9 9 0 0011 2z" fill="currentColor"/>
                      <path d="M15 14a.93.93.0 01-.45-.11l-4-2A1 1 0 0110 11V5a1 1 0 012 0v5.38l3.45 1.73a1 1 0 01.44 1.34A1 1 0 0115 14z" fill="currentColor"/>
                    </svg>
                    <span>{getDateString(note, cfg)}</span>
                    <span class="meta-dot">•</span>
                    <span>{getReadTime(note)}</span>
                  </div>
                  <h3 class="card-title">{titleOf(note)}</h3>
                  <p class="card-excerpt">{getExcerpt(note)}</p>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* Engineering Digest / Newsletter Callout */}
      <section class="newsletter-banner">
        <div class="newsletter-content">
          <div class="newsletter-text">
            <h3 class="newsletter-title">Practical DevOps & Linux Engineering</h3>
            <p class="newsletter-desc">
              Hands-on runbooks, battle-tested Kubernetes setups, and step-by-step system administration guides.
            </p>
          </div>
          <div class="newsletter-actions">
            <a href="/tags/" class="btn-primary-brand">
              Browse Topics
            </a>
            <a href="/blog/rhcsa-to-rhce-a-60-day-lab-curriculum" class="btn-secondary-brand">
              Start Curriculum →
            </a>
          </div>
        </div>
      </section>

      {/* Latest Articles List */}
      <section class="home-section" id="latest-articles">
        <div class="section-header-row">
          <div class="section-title-wrapper">
            <h2 class="section-title">Latest Articles</h2>
          </div>
          <a href="/tags/" class="section-action-link">
            View all topics →
          </a>
        </div>
        <div class="latest-articles-list">
          {latest.map((note) => {
            const url = resolveRelative(fileData.slug!, note.slug!)
            const section = note.frontmatter?.section ?? "Guide"
            return (
              <a href={url} class="latest-article-row group">
                <div class="latest-content">
                  <div class="latest-meta">
                    <svg role="img" aria-hidden="true" class="meta-icon" viewBox="0 0 22 22">
                      <path d="M11 22A11 11 0 1122 11 11 11 0 0111 22zM11 2a9 9 0 109 9A9 9 0 0011 2z" fill="currentColor"/>
                      <path d="M15 14a.93.93.0 01-.45-.11l-4-2A1 1 0 0110 11V5a1 1 0 012 0v5.38l3.45 1.73a1 1 0 01.44 1.34A1 1 0 0115 14z" fill="currentColor"/>
                    </svg>
                    <span>{getDateString(note, cfg)}</span>
                    <span class="meta-dot">•</span>
                    <span>{getReadTime(note)}</span>
                    <span class="meta-dot">•</span>
                    <span class="badge-section">{section}</span>
                  </div>
                  <h3 class="latest-title">{titleOf(note)}</h3>
                  <p class="latest-excerpt">{getExcerpt(note)}</p>
                </div>
                <div class="latest-thumb">{renderThumbnail(note)}</div>
              </a>
            )
          })}
        </div>
      </section>

      {/* Series & Cheatsheets Grid */}
      <section class="home-section" id="series-and-cheatsheets">
        <div class="series-cheatsheets-grid">
          {/* Series Column */}
          <div class="series-col">
            <div class="section-header-row">
              <div class="section-title-wrapper">
                <h2 class="section-title">Series</h2>
              </div>
            </div>
            {seriesNames.map((name) => {
              const parts = partsOf(notes, name)
              const first = parts[0]
              const url = first ? resolveRelative(fileData.slug!, first.slug!) : "#"
              return (
                <div class="series-card-home">
                  <div class="series-thumb-wrapper">{first && renderThumbnail(first)}</div>
                  <div class="series-body">
                    <div class="card-meta">
                      <span>{parts.length} parts</span>
                      <span class="meta-dot">•</span>
                      <span>Hands-on Labs</span>
                    </div>
                    <h3 class="card-title">{name}</h3>
                    {first?.frontmatter?.description && (
                      <p class="card-excerpt">{String(first.frontmatter.description)}</p>
                    )}
                    <a href={url} class="series-start-link">
                      Start series →
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cheatsheets Column */}
          <div class="cheatsheets-col">
            <div class="section-header-row">
              <div class="section-title-wrapper">
                <h2 class="section-title">Cheatsheets</h2>
              </div>
            </div>
            <div class="cheatsheets-list">
              {cheatsheets.map((note) => {
                const url = resolveRelative(fileData.slug!, note.slug!)
                return (
                  <a href={url} class="cheatsheet-card group">
                    <div class="card-meta">
                      <svg role="img" aria-hidden="true" class="meta-icon" viewBox="0 0 22 22">
                        <path d="M11 22A11 11 0 1122 11 11 11 0 0111 22zM11 2a9 9 0 109 9A9 9 0 0011 2z" fill="currentColor"/>
                        <path d="M15 14a.93.93.0 01-.45-.11l-4-2A1 1 0 0110 11V5a1 1 0 012 0v5.38l3.45 1.73a1 1 0 01.44 1.34A1 1 0 0115 14z" fill="currentColor"/>
                      </svg>
                      <span>{getDateString(note, cfg)}</span>
                    </div>
                    <h4 class="cheatsheet-title">{titleOf(note)}</h4>
                    <p class="cheatsheet-excerpt">{getExcerpt(note)}</p>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

PublishedNotes.css = style

export default (() => PublishedNotes) satisfies QuartzComponentConstructor
