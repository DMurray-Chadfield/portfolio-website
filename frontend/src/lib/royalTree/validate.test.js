import { describe, it, expect } from "vitest"
import { validateTree, informationalNotes, MONARCH_IDS } from "./validate.js"
import data from "../../data/royalFamilyTree.json"

describe("validateTree", () => {
  it("accepts a well-formed tree", () => {
    expect(validateTree({ people: [], families: [] })).toEqual([])
  })

  it("reports dangling references", () => {
    const bad = {
      people: [{ id: "a", name: "A", kind: "monarch", sex: "male", generation: 0, house: "H", reign: "1-2", summary: "s" }],
      families: [{ id: "f", husbandId: "a", wifeId: "missing", childIds: [] }]
    }
    expect(validateTree(bad).join(" ")).toContain("missing")
  })

  it("reports a missing generation", () => {
    const bad = { people: [{ id: "a", name: "A", kind: "monarch", sex: "male", house: "H", reign: "1-2", summary: "s" }], families: [] }
    expect(validateTree(bad).join(" ")).toContain("generation")
  })

  it("keeps informational notes out of the problems list", () => {
    const orphan = {
      people: [{ id: "a", name: "A", kind: "monarch", sex: "male", generation: 0, house: "H", reign: "1-2", summary: "s" }],
      families: []
    }
    expect(validateTree(orphan)).toEqual([])
    expect(informationalNotes(orphan).join(" ")).toContain("person a")
    expect(informationalNotes({ people: [], families: [] })).toEqual([])
  })

  it("validates the shipped dataset", () => {
    expect(validateTree(data)).toEqual([])
  })

  it("ships exactly the full roster of monarchs", () => {
    const monarchs = data.people.filter((p) => p.kind === "monarch").map((p) => p.id).sort()
    expect(monarchs).toEqual(MONARCH_IDS)
  })
})

describe("royalFamilyTree dataset", () => {
  it("is one connected component", () => {
    const adjacency = new Map(data.people.map((person) => [person.id, []]))
    const dangling = []
    const link = (a, b) => {
      if (!adjacency.has(a)) dangling.push(a)
      if (!adjacency.has(b)) dangling.push(b)
      if (!adjacency.has(a) || !adjacency.has(b)) return
      adjacency.get(a).push(b)
      adjacency.get(b).push(a)
    }
    for (const family of data.families) {
      const members = [family.husbandId, family.wifeId, ...(family.childIds ?? [])].filter((id) => id != null)
      for (let i = 1; i < members.length; i++) link(members[0], members[i])
    }
    expect(dangling).toEqual([])
    const components = []
    const seen = new Set()
    for (const person of data.people) {
      if (seen.has(person.id)) continue
      const component = []
      const stack = [person.id]
      seen.add(person.id)
      while (stack.length > 0) {
        const id = stack.pop()
        component.push(id)
        for (const neighbour of adjacency.get(id)) {
          if (seen.has(neighbour)) continue
          seen.add(neighbour)
          stack.push(neighbour)
        }
      }
      components.push(component)
    }
    expect(components).toHaveLength(1)
    expect(components[0]).toHaveLength(data.people.length)
  })
})
