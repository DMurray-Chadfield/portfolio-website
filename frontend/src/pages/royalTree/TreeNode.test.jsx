import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import TreeNode from "./TreeNode.jsx"

const monarchNode = { id: "alfred", kind: "monarch", sex: "male", x: 0, y: 0, w: 140, h: 44, person: { id: "alfred", name: "Alfred the Great", kind: "monarch" } }
const connectorNode = { id: "emma", kind: "connector", sex: "female", x: 0, y: 0, w: 140, h: 44, person: { id: "emma", name: "Emma of Normandy", kind: "connector" } }

describe("TreeNode", () => {
  it("renders a clickable monarch chip", () => {
    const html = renderToStaticMarkup(<TreeNode node={monarchNode} expanded={false} onSelect={() => {}} />)
    expect(html).toContain("Alfred the Great")
    expect(html).toContain("<button")
  })

  it("renders an inert connector chip", () => {
    const html = renderToStaticMarkup(<TreeNode node={connectorNode} expanded={false} onSelect={() => {}} />)
    expect(html).toContain("Emma of Normandy")
    expect(html).not.toContain("<button")
  })

  it("renders the fact card in place when expanded", () => {
    const html = renderToStaticMarkup(<TreeNode node={monarchNode} expanded onSelect={() => {}} />)
    expect(html).toContain("royal-tree-card")
  })
})
