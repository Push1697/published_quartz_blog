import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPluginData } from "../plugins/vfile"
import { resolveRelative } from "../util/path"
import style from "./styles/series.scss"

// A note belongs to a series when it declares one. `series_order` puts it in
// sequence; `series_group` optionally labels the phase it belongs to.
export const seriesOf = (file: QuartzPluginData): string | undefined =>
  typeof file.frontmatter?.series === "string" ? file.frontmatter.series : undefined

export const orderOf = (file: QuartzPluginData): number =>
  typeof file.frontmatter?.series_order === "number" ? file.frontmatter.series_order : 9999

export const groupOf = (file: QuartzPluginData): string | undefined =>
  typeof file.frontmatter?.series_group === "string" ? file.frontmatter.series_group : undefined

export const partsOf = (allFiles: QuartzPluginData[], series: string) =>
  allFiles.filter((f) => seriesOf(f) === series).sort((a, b) => orderOf(a) - orderOf(b))

export const groupParts = (parts: QuartzPluginData[]) => {
  const groups: { label: string | undefined; items: QuartzPluginData[] }[] = []
  for (const part of parts) {
    const label = groupOf(part)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(part)
    else groups.push({ label, items: [part] })
  }
  return groups
}

const titleOf = (file: QuartzPluginData) => file.frontmatter?.title ?? "Untitled note"

interface Options {
  // "header" states where you are; "footer" offers where to go next.
  mode: "header" | "footer"
}

export default ((opts?: Partial<Options>) => {
  const mode = opts?.mode ?? "header"

  const SeriesNav: QuartzComponent = ({ allFiles, fileData, displayClass }: QuartzComponentProps) => {
    const series = seriesOf(fileData)
    if (!series) return null

    const parts = partsOf(allFiles, series)
    const index = parts.findIndex((p) => p.slug === fileData.slug)
    if (index === -1 || parts.length < 2) return null

    const prev = parts[index - 1]
    const next = parts[index + 1]

    if (mode === "footer") {
      if (!prev && !next) return null
      return (
        <nav class={`${displayClass ?? ""} series-steps`} aria-label={`${series} — previous and next`}>
          {prev ? (
            <a class="series-step prev internal" href={resolveRelative(fileData.slug!, prev.slug!)}>
              <span class="series-step-label">← Part {orderOf(prev)}</span>
              <span class="series-step-title">{titleOf(prev)}</span>
            </a>
          ) : (
            <span class="series-step empty" />
          )}
          {next ? (
            <a class="series-step next internal" href={resolveRelative(fileData.slug!, next.slug!)}>
              <span class="series-step-label">Part {orderOf(next)} →</span>
              <span class="series-step-title">{titleOf(next)}</span>
            </a>
          ) : (
            <a class="series-step next internal" href={resolveRelative(fileData.slug!, parts[0].slug!)}>
              <span class="series-step-label">End of the series</span>
              <span class="series-step-title">Back to {titleOf(parts[0])}</span>
            </a>
          )}
        </nav>
      )
    }

    const group = groupOf(fileData)
    const isFirst = index === 0
    const percent = Math.round(((index + 1) / parts.length) * 100)

    return (
      <aside class={`${displayClass ?? ""} series-nav`} aria-label={`${series} series navigation`}>
        <div class="series-head">
          <div class="series-id">
            <span class="series-name">{series}</span>
            <span class="series-position">
              {isFirst ? `Series index · ${parts.length} parts` : `Part ${index + 1} of ${parts.length}`}
              {group && !isFirst && <span class="series-group"> · {group}</span>}
            </span>
          </div>
          <div
            class="series-progress"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={parts.length}
            aria-label={`Part ${index + 1} of ${parts.length}`}
          >
            <span style={`width:${percent}%`} />
          </div>
        </div>

        <details class="series-contents" open={isFirst}>
          <summary>
            <span>All {parts.length} parts</span>
          </summary>
          <ol class="series-list">
            {groupParts(parts).map((g) => (
              <>
                {g.label && <li class="series-list-group">{g.label}</li>}
                {g.items.map((part) => {
                  const current = part.slug === fileData.slug
                  return (
                    <li class={current ? "current" : ""}>
                      {current ? (
                        <span aria-current="page">
                          <span class="series-num">{orderOf(part)}</span>
                          {titleOf(part)}
                        </span>
                      ) : (
                        <a class="internal" href={resolveRelative(fileData.slug!, part.slug!)}>
                          <span class="series-num">{orderOf(part)}</span>
                          {titleOf(part)}
                        </a>
                      )}
                    </li>
                  )
                })}
              </>
            ))}
          </ol>
        </details>
      </aside>
    )
  }

  SeriesNav.css = style
  return SeriesNav
}) satisfies QuartzComponentConstructor<Partial<Options>>
