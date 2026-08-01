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
    icon: "⌂",
    href: "/",
    active: (slug) => slug === "index",
  },
  {
    label: "Articles",
    icon: "◫",
    href: "/0-inbox/",
    active: (slug) => slug === "0-inbox" || slug.startsWith("0-inbox/"),
  },
  {
    label: "Topics",
    icon: "#",
    href: "/tags/",
    active: (slug) => slug === "tags" || slug.startsWith("tags/"),
  },
  {
    label: "Papershelf",
    icon: "▤",
    href: "/papershelf/",
    active: (slug) => slug === "papershelf",
  },
  {
    label: "Bookshelf",
    icon: "▥",
    href: "/bookshelf/",
    active: (slug) => slug === "bookshelf",
  },
  {
    label: "About",
    icon: "◎",
    href: "/#about",
    active: () => false,
  },
  {
    label: "Portfolio",
    icon: "↗",
    href: "https://pushpendra.overflowbyte.cloud",
    active: () => false,
    external: true,
  },
  {
    label: "Blogs",
    icon: "✦",
    href: "https://blog.overflowbyte.cloud",
    active: () => false,
    external: true,
  },
]

const GardenNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const slug = fileData.slug ?? ""

  return (
    <nav class={`${displayClass ?? ""} garden-nav`} aria-label="Primary navigation">
      <p class="garden-nav-label">Navigate</p>
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
