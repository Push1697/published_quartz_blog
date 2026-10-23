import { Date, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"

interface ContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
  showComma: boolean
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
  showComma: true,
}

export default ((opts?: Partial<ContentMetaOptions>) => {
  // Merge options with defaults
  const options: ContentMetaOptions = { ...defaultOptions, ...opts }

  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: (string | JSX.Element)[] = []
      const author = fileData.frontmatter?.author ?? "Pushpendra"
      segments.push(<span class="meta-author">By {author}</span>)

      if (fileData.dates) {
        segments.push(
          <span class="meta-date">
            Published on <Date date={getDate(cfg, fileData)!} locale={cfg.locale} />
          </span>,
        )
      }

      // Display reading time if enabled
      if (options.showReadingTime) {
        const { minutes } = readingTime(text)
        segments.push(
          <span class="meta-read-time">
            <svg role="img" aria-hidden="true" class="meta-clock-icon" viewBox="0 0 22 22">
              <path d="M11 22A11 11 0 1122 11 11 11 0 0111 22zM11 2a9 9 0 109 9A9 9 0 0011 2z" fill="currentColor"/>
              <path d="M15 14a.93.93.0 01-.45-.11l-4-2A1 1 0 0110 11V5a1 1 0 012 0v5.38l3.45 1.73a1 1 0 01.44 1.34A1 1 0 0115 14z" fill="currentColor"/>
            </svg>
            <span>{Math.ceil(minutes)} min read</span>
          </span>,
        )
      }

      return (
        <p class={classNames(displayClass, "content-meta")}>
          {segments.map((segment, idx) => (
            <>
              {idx > 0 && <span class="meta-bullet">•</span>}
              {segment}
            </>
          ))}
        </p>
      )
    } else {
      return null
    }
  }

  ContentMetadata.css = style

  return ContentMetadata
}) satisfies QuartzComponentConstructor
