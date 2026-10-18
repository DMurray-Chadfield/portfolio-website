import { describe, it, expect } from "vitest"
import { buildGraph } from "./graph.js"
import { placeNodes, orderRow, NODE_W, NODE_H, CARD_W, CARD_H } from "./layout.js"

const fixture = {
  people: [
    { id: "aethelwulf", name: "Aethelwulf", kind: "monarch", sex: "male", generation: 2 },
    { id: "aethelbald", name: "Aethelbald", kind: "monarch", sex: "male", generation: 3 },
    { id: "alfred", name: "Alfred the Great", kind: "monarch", sex: "male", generation: 3 },
    { id: "emma", name: "Emma of Normandy", kind: "connector", sex: "female", generation: 7 },
    { id: "aethelred2", name: "Aethelred II", kind: "monarch", sex: "male", generation: 7 },
    { id: "edmund2", name: "Edmund II Ironside", kind: "monarch", sex: "male", generation: 8 },
    { id: "edward-confessor", name: "Edward the Confessor", kind: "monarch", sex: "male", generation: 8 }
  ],
  families: [
    { id: "f-aethelwulf", husbandId: "aethelwulf", wifeId: null, childIds: ["aethelbald", "alfred"] },
    { id: "f-aethelred2-first", husbandId: "aethelred2", wifeId: null, childIds: ["edmund2"] },
    { id: "f-aethelred2-emma", husbandId: "aethelred2", wifeId: "emma", childIds: ["edward-confessor"] }
  ]
}

const consortFixture = {
  people: [
    { id: "consort", name: "Consort", kind: "connector", sex: "male", generation: 2 },
    { id: "rival", name: "Rival", kind: "monarch", sex: "male", generation: 2 },
    { id: "queen", name: "Queen", kind: "monarch", sex: "female", generation: 2 },
    { id: "cousin", name: "Cousin", kind: "monarch", sex: "male", generation: 3 },
    { id: "heir", name: "Heir", kind: "monarch", sex: "male", generation: 3 }
  ],
  families: [
    { id: "f-rival", husbandId: "rival", wifeId: null, childIds: ["cousin"] },
    { id: "f-queen-consort", husbandId: "consort", wifeId: "queen", childIds: ["heir"] }
  ]
}

const nodesFor = (data, opts) => {
  const { nodes } = placeNodes(buildGraph(data), opts)
  return new Map(nodes.map((n) => [n.id, n]))
}

describe("placeNodes", () => {
  it("stacks generations top to bottom with no blank band", () => {
    const n = nodesFor(fixture)
    const ys = [...new Set([...n.values()].map((p) => p.y))].sort((a, b) => a - b)
    expect(ys.length).toBe(4) // generations 2,3,7,8 — gaps collapsed
    expect(n.get("aethelwulf").y).toBeLessThan(n.get("alfred").y)
    expect(n.get("aethelred2").y).toBeGreaterThan(n.get("alfred").y)
  })

  it("orders same-generation monarchs left to right by sequence", () => {
    const n = nodesFor(fixture)
    expect(n.get("aethelbald").x).toBeLessThan(n.get("alfred").x)
    expect(n.get("edmund2").x).toBeLessThan(n.get("edward-confessor").x)
  })

  it("places the spouse on the side of the shared children", () => {
    const n = nodesFor(fixture)
    // Edward the Confessor (Emma's son) is the right-hand child, so Emma sits right of Aethelred II.
    expect(n.get("emma").x).toBeGreaterThan(n.get("aethelred2").x)
    expect(n.get("emma").y).toBe(n.get("aethelred2").y)
  })

  it("renders a person in two families as one node", () => {
    const n = nodesFor(fixture)
    expect([...n.keys()].filter((id) => id === "aethelred2")).toHaveLength(1)
  })

  it("grows the expanded node and pushes later rows down", () => {
    const base = nodesFor(fixture)
    const open = nodesFor(fixture, { expandedId: "aethelwulf" })
    expect(open.get("aethelwulf").w).toBe(CARD_W)
    expect(open.get("aethelwulf").h).toBe(CARD_H)
    expect(open.get("alfred").y).toBeGreaterThan(base.get("alfred").y)
    expect(base.get("aethelwulf").w).toBe(NODE_W)
    expect(base.get("aethelwulf").h).toBe(NODE_H)
  })
})

describe("orderRow", () => {
  it("lets the monarch of a monarch-consort root couple keep the walk", () => {
    const graph = buildGraph(consortFixture)
    expect(orderRow(graph, graph.idsInGeneration(2))).toEqual(["rival", "queen", "consort"])
    expect(orderRow(graph, graph.idsInGeneration(3))).toEqual(["cousin", "heir"])
  })
})
