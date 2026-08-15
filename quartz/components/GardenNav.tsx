import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/gardenNav.scss"

type NavItem = {
  label: string
  icon: string
  href: string
  active: (slug: string) => boolean
  external?: boolean
}

const items: NavItem[] = [
  {
    label: "Home",
    icon: "🏠",
    href: "/",
    active: (slug) => slug === "index",
  },
  {
    label: "Graph view",
    icon: "🕸️",
    href: "#graph-view",
    active: () => false,
  },
  {
    label: "Articles",
    icon: "📝",
    href: "/0-inbox/",
    active: (slug) => slug === "0-inbox" || slug.startsWith("0-inbox/"),
  },
  {
    label: "Topics",
    icon: "🧠",
    href: "/tags/",
    active: (slug) => slug === "tags" || slug.startsWith("tags/"),
  },
  {
    label: "Reference guides",
    icon: "🛠️",
    href: "/3-Resources/",
    active: (slug) => slug === "3-Resources" || slug.startsWith("3-Resources/"),
  },
  {
    label: "About",
    icon: "👤",
    href: "/#about",
    active: () => false,
  },
]

const GardenNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const slug = fileData.slug ?? ""

  return (
    <nav class={`${displayClass ?? ""} garden-nav`} aria-label="Primary navigation">
      <ul>
        {items.map((item) => (
          <li>
            <a
              href={item.href}
              class={item.active(slug) ? "active" : ""}
              aria-current={item.active(slug) ? "page" : undefined}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              <span class="garden-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

GardenNav.css = style

export default (() => GardenNav) satisfies QuartzComponentConstructor
