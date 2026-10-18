import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import RoyalTreePage from "./RoyalTreePage.jsx"

describe("RoyalTreePage", () => {
  it("renders the heading and the tree", () => {
    const html = renderToStaticMarkup(<RoyalTreePage />)
    expect(html).toContain("Royal Family Tree")
    expect(html).toContain("royal-tree-canvas")
  })
})
