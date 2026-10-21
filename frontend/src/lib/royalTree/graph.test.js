import { describe, it, expect } from "vitest"
import { buildGraph } from "./graph.js"

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

describe("buildGraph", () => {
  it("resolves parents from families", () => {
    expect(buildGraph(fixture).parentIdsOf("alfred")).toEqual(["aethelwulf"])
  })

  it("collects children across all of a person's families, preserving family order", () => {
    expect(buildGraph(fixture).childIdsOf("aethelred2")).toEqual(["edmund2", "edward-confessor"])
  })

  it("reports spouses on both sides", () => {
    const g = buildGraph(fixture)
    expect(g.spouseIdsOf("emma")).toEqual(["aethelred2"])
    expect(g.spouseIdsOf("aethelred2")).toEqual(["emma"])
  })

  it("returns roots, handling multiple roots", () => {
    const g = buildGraph(fixture)
    expect(g.roots().map((p) => p.id).sort()).toEqual(["aethelred2", "aethelwulf", "emma"])
  })

  it("groups people by generation and collapses gaps", () => {
    const g = buildGraph(fixture)
    expect(g.generations()).toEqual([2, 3, 7, 8])
    expect(g.idsInGeneration(3)).toEqual(["aethelbald", "alfred"])
  })

  it("renders a person in two families once", () => {
    const g = buildGraph(fixture)
    expect(g.familyIdsOf("aethelred2")).toEqual(["f-aethelred2-first", "f-aethelred2-emma"])
  })
})
