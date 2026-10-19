import { describe, it, expect } from "vitest"
import { buildGraph } from "./graph.js"
import { placeNodes, orderRow, buildEdges, edgeToPath, computeLayout, NODE_W, NODE_H, CARD_W, CARD_H } from "./layout.js"

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

const marriedInFixture = {
  people: [
    { id: "james2", name: "James II", kind: "monarch", sex: "male", generation: 0 },
    { id: "mary2", name: "Mary II", kind: "monarch", sex: "female", generation: 1 },
    { id: "anne", name: "Anne", kind: "monarch", sex: "female", generation: 1 },
    { id: "william3", name: "William III", kind: "monarch", sex: "male", generation: 1 },
    { id: "george1", name: "George I", kind: "monarch", sex: "male", generation: 1 },
    { id: "george2", name: "George II", kind: "monarch", sex: "male", generation: 2 }
  ],
  families: [
    { id: "f-james2", husbandId: "james2", wifeId: null, childIds: ["mary2", "anne"] },
    { id: "f-william3-mary2", husbandId: "william3", wifeId: "mary2", childIds: [] },
    { id: "f-george1", husbandId: "george1", wifeId: null, childIds: ["george2"] }
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

  it("keeps a married-in spouse adjacent to their partner", () => {
    const n = nodesFor(marriedInFixture)
    const row = [...n.values()]
      .filter((p) => p.y === n.get("mary2").y)
      .sort((a, b) => a.x - b.x)
      .map((p) => p.id)
    expect(row).toContain("william3")
    expect(Math.abs(row.indexOf("mary2") - row.indexOf("william3"))).toBe(1)
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

describe("buildEdges", () => {
  const graph = buildGraph(fixture)
  const { nodes } = placeNodes(graph)
  const edges = buildEdges(graph, nodes)
  const byId = new Map(edges.map((e) => [e.id, e]))
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  it("makes one blood edge per family with drawn children", () => {
    expect(byId.has("blood:f-aethelwulf")).toBe(true)
    expect(byId.has("blood:f-aethelred2-first")).toBe(true)
    expect(byId.has("blood:f-aethelred2-emma")).toBe(true)
    expect(byId.has("blood:f-aethelred2")).toBe(false)
  })

  it("spans the sibling bar across the children's centres", () => {
    const e = byId.get("blood:f-aethelwulf")
    const bal = nodeById.get("aethelbald")
    const alf = nodeById.get("alfred")
    expect(e.barLeft).toBeCloseTo(bal.x + bal.w / 2)
    expect(e.barRight).toBeCloseTo(alf.x + alf.w / 2)
    expect(e.drops).toHaveLength(2)
  })

  it("drops a single-parent family from that parent's centre", () => {
    const e = byId.get("blood:f-aethelred2-first")
    const p = nodeById.get("aethelred2")
    expect(e.stemTop.x).toBeCloseTo(p.x + p.w / 2)
    expect(e.drops[0].x).toBeCloseTo(nodeById.get("edmund2").x + nodeById.get("edmund2").w / 2)
  })

  it("stems a couple's children from between the spouses and dots the marriage", () => {
    const e = byId.get("blood:f-aethelred2-emma")
    const m = byId.get("marriage:f-aethelred2-emma")
    const a = nodeById.get("aethelred2")
    const b = nodeById.get("emma")
    expect(e.stemTop.x).toBeCloseTo((a.x + a.w / 2 + b.x + b.w / 2) / 2)
    expect(m.dot).not.toBeNull()
    expect(m.a.x).toBeCloseTo(a.x + a.w)
    expect(m.b.x).toBeCloseTo(b.x)
  })

  it("renders geometry to an SVG path", () => {
    expect(edgeToPath(byId.get("blood:f-aethelwulf"))).toMatch(/^M[\d.]+ [\d.]+/)
    expect(edgeToPath(byId.get("marriage:f-aethelred2-emma"))).toMatch(/^M[\d.]+ [\d.]+ H[\d.]+/)
  })
})

describe("computeLayout", () => {
  it("composes graph, placement and edges", () => {
    const layout = computeLayout(fixture, { expandedId: "emma" })
    expect(layout.nodes.some((n) => n.id === "emma" && n.w === 340)).toBe(true)
    expect(layout.edges.length).toBeGreaterThan(0)
    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
  })
})
