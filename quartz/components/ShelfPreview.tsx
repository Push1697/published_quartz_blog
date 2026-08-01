// @ts-ignore
import script from "./scripts/shelf-preview.inline"
import style from "./styles/shelf.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const ShelfPreview: QuartzComponent = () => null

ShelfPreview.afterDOMLoaded = script
ShelfPreview.css = style

export default (() => ShelfPreview) satisfies QuartzComponentConstructor
