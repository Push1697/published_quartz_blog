import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <div class={classNames(displayClass, "page-title")}>
      <a href={baseDir} class="brand-link" aria-label={title}>
        <img
          src={`${baseDir}/static/icon.png`}
          alt={title}
          class="brand-logo"
          width="32"
          height="32"
          loading="eager"
        />
        <span class="brand-text">
          <span class="brand-text-main">Overflow</span>
          <span class="brand-text-accent">Byte</span>
        </span>
      </a>
    </div>
  )
}

PageTitle.css = `
.page-title {
  margin: 0;
  display: flex;
  align-items: center;
}

.page-title .brand-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: var(--dark);
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.page-title .brand-link:hover {
  opacity: 0.9;
  transform: translateY(-0.5px);
}

.page-title .brand-logo {
  height: 2.1rem;
  width: 2.1rem;
  border-radius: 6px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

.page-title .brand-text {
  font-family: var(--headerFont);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  display: inline-flex;
  align-items: baseline;
  line-height: 1;
}

.page-title .brand-text-main {
  color: var(--dark);
}

.page-title .brand-text-accent {
  color: #f2994a;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
