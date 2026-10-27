import { describe, it, expect } from "vitest"
import { buildHouseRegions } from "./houses.js"
import { computeLayout } from "./layout.js"
import data from "../../data/royalFamilyTree.json"

function monarch(id, house, x, y, w = 140, h = 44) {
  return { id, kind: "monarch", x, y, w, h, person: { id, kind: "monarch", house } }
}

function connector(id, house, x, y) {
  return { id, kind: "connector", x, y, w: 140, h: 44, person: { id, kind: "connector", house } }
}

describe("buildHouseRegions", () => {
  it("groups monarch nodes by house and ignores connectors", () => {
    const nodes = [
      monarch("a", "House of Wessex", 48, 48),
      connector("connector", "House of Normandy", 0, 0),
      monarch("b", "House of Wessex", 200, 160, 340, 240)
    ]
    const regions = buildHouseRegions(nodes)
    expect(regions).toHaveLength(1)
    expect(regions[0].house).toBe("House of Wessex")
  })

  it("bounds every node in a house with 20px padding", () => {
    const nodes = [
      monarch("a", "House of Wessex", 48, 48),
      monarch("b", "House of Wessex", 200, 160, 340, 240)
    ]
    const [region] = buildHouseRegions(nodes)
    expect(region).toMatchObject({ x: 28, y: 28, width: 532, height: 392 })
  })

  it("includes an expanded node's larger dimensions", () => {
    const [region] = buildHouseRegions([monarch("a", "House of Wessex", 48, 48, 340, 300)])
    expect(region).toMatchObject({ x: 28, y: 28, width: 380, height: 340 })
  })

  it("covers all 12 shipped houses with distinct colours", () => {
    const layout = computeLayout(data)
    const regions = buildHouseRegions(layout.nodes)
    const houses = new Set(regions.map((region) => region.house))
    const colours = new Set(regions.map((region) => region.color))

    expect(regions).toHaveLength(12)
    expect(houses.size).toBe(12)
    expect(colours.size).toBe(12)
    for (const region of regions) {
      expect(region.color, region.house).toBeTruthy()
    }
  })
})
