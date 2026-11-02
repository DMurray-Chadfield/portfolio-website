import { describe, it, expect } from "vitest"
import { buildHouseRegions, houseLabelParts } from "./houses.js"
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

  it("bounds every node in a house with 20px padding and an 18px label band", () => {
    const nodes = [
      monarch("a", "House of Wessex", 48, 48),
      monarch("b", "House of Wessex", 200, 160, 340, 240)
    ]
    const [region] = buildHouseRegions(nodes)
    expect(region).toMatchObject({ x: 28, y: 10, width: 532, height: 410 })
  })

  it("includes an expanded node's larger dimensions", () => {
    const [region] = buildHouseRegions([monarch("a", "House of Wessex", 48, 48, 340, 300)])
    expect(region).toMatchObject({ x: 28, y: 10, width: 380, height: 358 })
  })

  it("reserves the label band above the topmost node only", () => {
    const [region] = buildHouseRegions([monarch("a", "House of Wessex", 48, 48)])
    expect(region).toMatchObject({ x: 28, y: 10, width: 180, height: 102 })
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

describe("houseLabelParts", () => {
  it("splits the House of prefix from the dynasty name", () => {
    expect(houseLabelParts("House of Saxe-Coburg and Gotha")).toEqual({
      prefix: "House of",
      name: "Saxe-Coburg and Gotha"
    })
  })

  it("falls back to the whole name when there is no prefix", () => {
    expect(houseLabelParts("Wessex")).toEqual({ prefix: "", name: "Wessex" })
  })
})
