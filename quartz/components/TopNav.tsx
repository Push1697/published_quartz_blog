import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const TopNav: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class={classNames(displayClass, "top-nav-container")}>
      <nav class="top-nav-links" aria-label="Main Navigation">
        <a href="/blog/rhcsa-to-rhce-a-60-day-lab-curriculum" class="nav-link">Start Here</a>
        <a href="/#published-guides" class="nav-link">Guides</a>
        <a href="/#published-runbooks" class="nav-link">Runbooks</a>
        <a href="/#published-series" class="nav-link">Series</a>
        <a href="/#published-reference" class="nav-link">Cheatsheets</a>
        <a href="/#published-troubleshooting" class="nav-link">Troubleshooting</a>
        <a href="/#about" class="nav-link">About</a>
      </nav>

      {/* Mobile menu trigger */}
      <button id="mobile-menu-toggle" class="mobile-menu-btn" aria-label="Open navigation menu">
        <svg role="img" aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
        </svg>
      </button>

      {/* Mobile Drawer */}
      <div id="mobile-nav-drawer" class="mobile-drawer" aria-hidden="true">
        <div class="mobile-drawer-backdrop" id="mobile-nav-backdrop"></div>
        <div class="mobile-drawer-panel">
          <div class="mobile-drawer-header">
            <span class="mobile-drawer-title">Navigation</span>
            <button id="mobile-menu-close" class="mobile-drawer-close" aria-label="Close menu">
              <svg role="img" aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          <ul class="mobile-nav-list">
            <li><a href="/blog/rhcsa-to-rhce-a-60-day-lab-curriculum">Start Here</a></li>
            <li><a href="/#published-guides">Guides</a></li>
            <li><a href="/#published-runbooks">Runbooks</a></li>
            <li><a href="/#published-series">Series</a></li>
            <li><a href="/#published-reference">Cheatsheets</a></li>
            <li><a href="/#published-troubleshooting">Troubleshooting</a></li>
            <li><a href="/tags/">All Topics</a></li>
            <li><a href="/#about">About</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

TopNav.css = `
.top-nav-container {
  display: flex;
  align-items: center;
}

.top-nav-links {
  display: none;
  align-items: center;
  gap: 0.35rem;
}

@media (min-width: 900px) {
  .top-nav-links {
    display: flex;
  }
}

.top-nav-links .nav-link {
  font-family: var(--bodyFont);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--darkgray);
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.top-nav-links .nav-link:hover {
  background: var(--highlight);
  color: var(--secondary);
}

.mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--lightgray);
  border-radius: 6px;
  background: transparent;
  color: var(--darkgray);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mobile-menu-btn:hover {
  background: var(--highlight);
  color: var(--secondary);
  border-color: var(--secondary);
}

@media (min-width: 900px) {
  .mobile-menu-btn {
    display: none;
  }
}

/* Mobile Drawer */
.mobile-drawer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0.25s, opacity 0.25s ease;
}

.mobile-drawer.open {
  visibility: visible;
  opacity: 1;
}

.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.mobile-drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 18rem;
  max-width: 85vw;
  background: var(--light);
  border-left: 1px solid var(--lightgray);
  padding: 1.5rem;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.25);
  transform: translateX(100%);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
}

.mobile-drawer.open .mobile-drawer-panel {
  transform: translateX(0);
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--lightgray);
}

.mobile-drawer-title {
  font-family: var(--headerFont);
  font-size: 1rem;
  font-weight: 700;
  color: var(--dark);
}

.mobile-drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--lightgray);
  border-radius: 6px;
  background: transparent;
  color: var(--darkgray);
  cursor: pointer;
}

.mobile-drawer-close:hover {
  background: var(--highlight);
  color: var(--secondary);
}

.mobile-nav-list {
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mobile-nav-list a {
  display: block;
  padding: 0.65rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--darkgray);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.mobile-nav-list a:hover {
  background: var(--highlight);
  color: var(--secondary);
}
`

const mobileScript = `
document.addEventListener("nav", () => {
  const toggleBtn = document.getElementById("mobile-menu-toggle")
  const closeBtn = document.getElementById("mobile-menu-close")
  const backdrop = document.getElementById("mobile-nav-backdrop")
  const drawer = document.getElementById("mobile-nav-drawer")

  function openMenu() {
    drawer?.classList.add("open")
  }
  function closeMenu() {
    drawer?.classList.remove("open")
  }

  toggleBtn?.addEventListener("click", openMenu)
  closeBtn?.addEventListener("click", closeMenu)
  backdrop?.addEventListener("click", closeMenu)

  drawer?.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", closeMenu)
  })
})
`

TopNav.afterDOMLoaded = mobileScript

export default (() => TopNav) satisfies QuartzComponentConstructor
