import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import TreeCanvas from "./TreeCanvas.jsx"
import data from "../../data/royalFamilyTree.json"

describe("TreeCanvas", () => {
  it("renders a chip for every person and an edge path per family", () => {
    const html = renderToStaticMarkup(<TreeCanvas data={data} expandedId={null} onSelect={() => {}} />)
    expect(html).toContain("Aethelwulf")
    expect(html).toContain("Emma of Normandy")
    expect(html).toContain("<path")
  })

  it("renders the expanded node's card", () => {
    const html = renderToStaticMarkup(<TreeCanvas data={data} expandedId="alfred" onSelect={() => {}} />)
    expect(html).toContain("royal-tree-card")
  })

  it("renders zoom controls", () => {
    const html = renderToStaticMarkup(<TreeCanvas data={data} expandedId={null} onSelect={() => {}} />)
    expect(html).toContain("royal-tree-controls")
  })
})
