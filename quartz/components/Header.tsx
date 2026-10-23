import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return children.length > 0 ? <header>{children}</header> : null
}

Header.css = `
.site-header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3.75rem;
  z-index: 999;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--lightgray);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

:root[saved-theme="dark"] .site-header-wrapper {
  background: rgba(2, 6, 23, 0.92);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.site-header-wrapper header {
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
