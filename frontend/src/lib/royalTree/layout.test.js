import { describe, it, expect } from "vitest"
import { buildGraph } from "./graph.js"
import { buildClusters } from "./clusters.js"
import { placeNodes, buildEdges, edgeToPath, computeLayout, NODE_W, NODE_H, CARD_W, CARD_H, SPOUSE_GAP, SIBLING_GAP } from "./layout.js"
import data from "../../data/royalFamilyTree.json"

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

const crossBandFixture = {
  people: [
    { id: "founder", name: "Founder", kind: "monarch", sex: "male", generation: 0 },
    { id: "branch", name: "Branch", kind: "connector", sex: "male", generation: 0 },
    { id: "far", name: "Far", kind: "connector", sex: "male", generation: 0 },
    { id: "first", name: "First", kind: "monarch", sex: "male", generation: 1 },
    { id: "groom", name: "Groom", kind: "connector", sex: "male", generation: 1 },
    { id: "bride", name: "Bride", kind: "connector", sex: "female", generation: 1 },
    { id: "last", name: "Last", kind: "monarch", sex: "male", generation: 1 },
    { id: "side", name: "Side", kind: "connector", sex: "male", generation: 1 },
    { id: "child", name: "Child", kind: "monarch", sex: "male", generation: 2 }
  ],
  families: [
    { id: "f-founder", husbandId: "founder", wifeId: null, childIds: ["first", "groom", "last"] },
    { id: "f-branch", husbandId: "branch", wifeId: null, childIds: ["side"] },
    { id: "f-far", husbandId: "far", wifeId: null, childIds: ["bride"] },
    { id: "f-groom-bride", husbandId: "groom", wifeId: "bride", childIds: ["child"] }
  ]
}

const nodesFor = (data, opts) => {
  const { nodes } = placeNodes(buildGraph(data), opts)
  return new Map(nodes.map((n) => [n.id, n]))
}

const familyById = new Map(data.families.map((family) => [family.id, family]))

const parentIdsOfFamily = (familyId) => {
  const family = familyById.get(familyId)
  return [family.husbandId, family.wifeId].filter((id) => id != null)
}

const shareAParent = (a, b) => {
  const parentsA = parentIdsOfFamily(a.familyId)
  const parentsB = parentIdsOfFamily(b.familyId)
  return parentsA.some((id) => parentsB.includes(id))
}

const centreOf = (node) => node.x + node.w / 2

const familyCountByParent = new Map()
for (const family of data.families) {
  for (const id of [family.husbandId, family.wifeId]) {
    if (id == null) continue
    familyCountByParent.set(id, (familyCountByParent.get(id) ?? 0) + 1)
  }
}

const soleFamilyForParents = (familyId) =>
  parentIdsOfFamily(familyId).every((id) => familyCountByParent.get(id) === 1)

const expectBarsApart = (a, b) => {
  const apart = a.barY !== b.barY || a.barRight < b.barLeft || b.barRight < a.barLeft
  expect(apart, `${a.id} vs ${b.id}`).toBe(true)
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

  it("sizes the expanded node to a measured card height", () => {
    const base = nodesFor(fixture)
    const open = nodesFor(fixture, { expandedId: "aethelwulf", expandedHeight: 320 })
    expect(open.get("aethelwulf").h).toBe(320)
    expect(open.get("alfred").y).toBeGreaterThan(base.get("alfred").y + (CARD_H - NODE_H))
  })

  it("lets the monarch of a monarch-consort root couple keep the walk", () => {
    const n = nodesFor(consortFixture)
    const rowOrder = (id) => {
      const y = n.get(id).y
      return [...n.values()]
        .filter((node) => node.y === y)
        .sort((a, b) => a.x - b.x)
        .map((node) => node.id)
    }
    expect(rowOrder("rival")).toEqual(["rival", "queen", "consort"])
    expect(rowOrder("cousin")).toEqual(["cousin", "heir"])
  })

  it("reserves only chip widths for a childless couple", () => {
    const n = nodesFor(marriedInFixture)
    const couple = [n.get("mary2"), n.get("william3")].sort((a, b) => a.x - b.x)
    expect(couple[1].x - (couple[0].x + couple[0].w)).toBeCloseTo(SPOUSE_GAP)
    expect(n.get("anne").x - (couple[1].x + couple[1].w)).toBeCloseTo(SIBLING_GAP)
  })
})

describe("lane routing", () => {
  it("routes a cross-band reach in its own lane", () => {
    const layout = computeLayout(crossBandFixture)
    const blood = (familyId) => layout.edges.find((edge) => edge.id === `blood:${familyId}`)
    const founderBar = blood("f-founder")
    const branchBar = blood("f-branch")
    const farBar = blood("f-far")
    const nodeById = new Map(layout.nodes.map((node) => [node.id, node]))
    const brideCentre = nodeById.get("bride").x + nodeById.get("bride").w / 2

    expect(farBar.drops[0].x).toBeCloseTo(brideCentre)
    expect(farBar.barLeft).toBeLessThanOrEqual(founderBar.barRight)
    expect(founderBar.barY).not.toBeCloseTo(farBar.barY)
    expect(branchBar.barY).not.toBeCloseTo(farBar.barY)
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
    const bloodFamilyIds = edges.filter((e) => e.kind === "blood").map((e) => e.familyId).sort()
    expect(bloodFamilyIds).toEqual([...new Set(bloodFamilyIds)].sort())
    expect(bloodFamilyIds).toHaveLength(fixture.families.filter((f) => f.childIds.length > 0).length)
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
    expect(m.dot.x).toBeCloseTo(e.stemTop.x)
    expect(m.dot.y).toBeCloseTo(m.a.y)
    expect(e.stemTop.y).toBeCloseTo(m.a.y)
    expect(m.a.x).toBeCloseTo(a.x + a.w)
    expect(m.b.x).toBeCloseTo(b.x)
  })

  it("anchors the marriage bar and dot to the couple's chip centres when a card is open in the row", () => {
    const openGraph = buildGraph(fixture)
    const open = placeNodes(openGraph, { expandedId: "aethelred2" })
    const openEdges = buildEdges(openGraph, open.nodes)
    const m = openEdges.find((edge) => edge.id === "marriage:f-aethelred2-emma")
    const e = openEdges.find((edge) => edge.id === "blood:f-aethelred2-emma")
    const emma = open.nodes.find((node) => node.id === "emma")
    expect(m.a.y).toBe(emma.y + NODE_H / 2)
    expect(m.dot.y).toBeCloseTo(m.a.y)
    expect(m.dot.x).toBeCloseTo(e.stemTop.x)
    expect(m.dot.x).toBeGreaterThan(m.a.x)
    expect(m.dot.x).toBeLessThan(m.b.x)
  })

  it("draws a childless couple's marriage without a dot or blood edge", () => {
    const childlessGraph = buildGraph(marriedInFixture)
    const { nodes } = placeNodes(childlessGraph)
    const childlessEdges = buildEdges(childlessGraph, nodes)
    const m = childlessEdges.find((edge) => edge.id === "marriage:f-william3-mary2")
    expect(m.dot).toBeNull()
    expect(childlessEdges.some((edge) => edge.kind === "blood" && edge.familyId === "f-william3-mary2")).toBe(false)
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

  it("meets every descent stem on its sibling bar in the shipped dataset", () => {
    const layout = computeLayout(data)
    const blood = layout.edges.filter((edge) => edge.kind === "blood")
    expect(blood.length).toBeGreaterThan(0)
    for (const edge of blood) {
      expect(edge.barLeft, edge.id).toBeLessThanOrEqual(edge.stemTop.x)
      expect(edge.barRight, edge.id).toBeGreaterThanOrEqual(edge.stemTop.x)
    }
  })
})

describe("shipped tree geometry invariants", () => {
  it("keeps unrelated families' sibling bars apart in a shared gutter", () => {
    const blood = computeLayout(data).edges.filter((edge) => edge.kind === "blood")
    for (let i = 0; i < blood.length; i++) {
      for (let j = i + 1; j < blood.length; j++) {
        const a = blood[i]
        const b = blood[j]
        if (a.barY !== b.barY || shareAParent(a, b)) continue
        expect(a.barRight < b.barLeft || b.barRight < a.barLeft, `${a.id} vs ${b.id}`).toBe(true)
      }
    }
  })

  it("never drops a child through another family's bar", () => {
    const blood = computeLayout(data).edges.filter((edge) => edge.kind === "blood")
    for (const edge of blood) {
      for (const drop of edge.drops) {
        for (const other of blood) {
          if (other === edge || shareAParent(edge, other)) continue
          const crossesBar = other.barY > drop.y1 && other.barY < drop.y2
          const withinBar = other.barLeft <= drop.x && drop.x <= other.barRight
          expect(crossesBar && withinBar, `${edge.id} drop vs ${other.id}`).toBe(false)
        }
      }
    }
  })

  it("centres a sole family's parent over its single home child", () => {
    const graph = buildGraph(data)
    const { clusterById, clusterIdOfPerson } = buildClusters(graph)
    const layout = computeLayout(data)
    const nodeById = new Map(layout.nodes.map((node) => [node.id, node]))
    const anchorOf = (clusterId) => {
      const memberIds = clusterById.get(clusterId).memberIds
      return memberIds.reduce((sum, id) => sum + centreOf(nodeById.get(id)), 0) / memberIds.length
    }
    const parentClusterOf = (family) => clusterIdOfPerson.get(parentIdsOfFamily(family.id)[0])
    const homeChildIds = (family) => {
      const parentClusterId = parentClusterOf(family)
      return family.childIds.filter((id) => {
        const childCluster = clusterById.get(clusterIdOfPerson.get(id))
        return childCluster?.birthClusterId === parentClusterId
      })
    }
    for (const family of data.families) {
      if (!soleFamilyForParents(family.id)) continue
      const homeChildren = homeChildIds(family)
      if (homeChildren.length !== 1) continue
      const parentAnchor = anchorOf(parentClusterOf(family))
      const childCentre = centreOf(nodeById.get(homeChildren[0]))
      expect(Math.abs(parentAnchor - childCentre), family.id).toBeLessThanOrEqual(1)
    }
  })

  it("centres sole parents over their home children", () => {
    const graph = buildGraph(data)
    const { clusterById, clusterIdOfPerson } = buildClusters(graph)
    const layout = computeLayout(data)
    const nodeById = new Map(layout.nodes.map((node) => [node.id, node]))
    const anchorOf = (clusterId) => {
      const memberIds = clusterById.get(clusterId).memberIds
      return memberIds.reduce((sum, id) => sum + centreOf(nodeById.get(id)), 0) / memberIds.length
    }
    const parentClusterOf = (family) => clusterIdOfPerson.get(parentIdsOfFamily(family.id)[0])
    for (const family of data.families) {
      if (!soleFamilyForParents(family.id)) continue
      const parentClusterId = parentClusterOf(family)
      const homeChildCentres = family.childIds
        .filter((id) => clusterById.get(clusterIdOfPerson.get(id))?.birthClusterId === parentClusterId)
        .map((id) => centreOf(nodeById.get(id)))
      if (homeChildCentres.length < 2) continue
      const spanCentre = (Math.min(...homeChildCentres) + Math.max(...homeChildCentres)) / 2
      expect(Math.abs(anchorOf(parentClusterId) - spanCentre), family.id).toBeLessThanOrEqual(1)
    }
  })
})

describe("reported crossing cases", () => {
  const layout = computeLayout(data)
  const bloodOf = (familyId) => layout.edges.find((edge) => edge.id === `blood:${familyId}`)

  it("separates Henry I's and Adela of Blois's children", () => {
    expectBarsApart(bloodOf("f-henry1"), bloodOf("f-adela"))
  })

  it("separates the Wars of the Roses descent bars", () => {
    expectBarsApart(bloodOf("f-john-beaufort-duke"), bloodOf("f-richard-york"))
  })

  it("separates Henry VIII's and Margaret Tudor's children", () => {
    for (const henryFamily of ["f-henry8-jane", "f-henry8-catherine", "f-henry8-anne"]) {
      for (const margaretFamily of ["f-margaret-tudor-james4", "f-margaret-tudor-douglas"]) {
        expectBarsApart(bloodOf(henryFamily), bloodOf(margaretFamily))
      }
    }
  })

  it("separates Charles I's and Elizabeth Stuart's children", () => {
    expectBarsApart(bloodOf("f-charles1"), bloodOf("f-elizabeth-stuart"))
  })

  it("separates James II's and Sophia of Hanover's children", () => {
    expectBarsApart(bloodOf("f-james2"), bloodOf("f-sophia"))
  })

  it("keeps siblings in succession order inside their band", () => {
    const graph = buildGraph(data)
    const { clusterById, clusterIdOfPerson } = buildClusters(graph)
    const nodeById = new Map(layout.nodes.map((node) => [node.id, node]))
    for (const family of data.families) {
      const parentClusterId = clusterIdOfPerson.get(parentIdsOfFamily(family.id)[0])
      const homeChildIds = family.childIds.filter(
        (id) => clusterById.get(clusterIdOfPerson.get(id))?.birthClusterId === parentClusterId
      )
      if (homeChildIds.length < 2) continue
      const xs = homeChildIds.map((id) => nodeById.get(id).x)
      for (let i = 1; i < xs.length; i += 1) expect(xs[i], family.id).toBeGreaterThan(xs[i - 1])
    }
  })

  it("keeps bars apart and children centred with a card open", () => {
    const openLayout = computeLayout(data, { expandedId: "henry1" })
    const openBlood = openLayout.edges.filter((edge) => edge.kind === "blood")
    for (let i = 0; i < openBlood.length; i += 1) {
      for (let j = i + 1; j < openBlood.length; j += 1) {
        const a = openBlood[i]
        const b = openBlood[j]
        if (a.barY !== b.barY || shareAParent(a, b)) continue
        expect(a.barRight < b.barLeft || b.barRight < a.barLeft, `${a.id} vs ${b.id}`).toBe(true)
      }
    }
    const nodeById = new Map(openLayout.nodes.map((node) => [node.id, node]))
    const childCentres = ["aethelbald", "aethelberht", "aethelred1", "alfred"].map((id) => centreOf(nodeById.get(id)))
    const spanCentre = (Math.min(...childCentres) + Math.max(...childCentres)) / 2
    expect(centreOf(nodeById.get("aethelwulf"))).toBeCloseTo(spanCentre, 0)
  })
})
