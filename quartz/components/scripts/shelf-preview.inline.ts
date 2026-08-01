let previewEl: HTMLDivElement | null = null

function ensurePreviewEl(): HTMLDivElement {
  if (previewEl && document.body.contains(previewEl)) return previewEl
  previewEl = document.createElement("div")
  previewEl.className = "shelf-preview"
  const inner = document.createElement("div")
  inner.className = "shelf-preview-inner"
  previewEl.appendChild(inner)
  document.body.appendChild(previewEl)
  return previewEl
}

function positionPreview(el: HTMLElement, clientX: number, clientY: number) {
  const width = el.offsetWidth || 300
  const height = el.offsetHeight || 380
  const margin = 20
  let left = clientX + margin
  let top = clientY - height / 2

  if (left + width + margin > window.innerWidth) {
    left = clientX - width - margin
  }
  top = Math.max(margin, Math.min(top, window.innerHeight - height - margin))
  el.style.transform = `translate(${left.toFixed()}px, ${top.toFixed()}px)`
}

function showPreview(target: HTMLElement, clientX: number, clientY: number) {
  const type = target.dataset.previewType
  const src = target.dataset.previewSrc
  if (!src) return

  const el = ensurePreviewEl()
  const inner = el.querySelector(".shelf-preview-inner") as HTMLDivElement

  if (inner.dataset.currentSrc !== src) {
    inner.innerHTML = ""
    if (type === "pdf") {
      const iframe = document.createElement("iframe")
      iframe.src = src
      iframe.loading = "lazy"
      inner.appendChild(iframe)
    } else {
      const img = document.createElement("img")
      img.src = src
      img.alt = target.dataset.previewAlt ?? ""
      inner.appendChild(img)
    }
    inner.dataset.currentSrc = src
  }

  el.classList.add("active-shelf-preview")
  positionPreview(el, clientX, clientY)
}

function hidePreview() {
  previewEl?.classList.remove("active-shelf-preview")
}

document.addEventListener("nav", () => {
  const items = [...document.querySelectorAll<HTMLElement>("[data-preview-src]")]
  for (const item of items) {
    const enter = (ev: MouseEvent) => showPreview(item, ev.clientX, ev.clientY)
    const move = (ev: MouseEvent) => {
      if (previewEl?.classList.contains("active-shelf-preview")) {
        positionPreview(previewEl, ev.clientX, ev.clientY)
      }
    }
    const leave = () => hidePreview()

    item.addEventListener("mouseenter", enter)
    item.addEventListener("mousemove", move)
    item.addEventListener("mouseleave", leave)
    window.addCleanup(() => {
      item.removeEventListener("mouseenter", enter)
      item.removeEventListener("mousemove", move)
      item.removeEventListener("mouseleave", leave)
    })
  }

  const scrollHandler = () => hidePreview()
  document.addEventListener("scroll", scrollHandler, { passive: true, capture: true })
  window.addCleanup(() => document.removeEventListener("scroll", scrollHandler, { capture: true }))
})
