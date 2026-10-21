export function buildGraph(data) {
  const people = data.people ?? []
  const families = data.families ?? []

  const personById = new Map(people.map((person) => [person.id, person]))
  const familyById = new Map(families.map((family) => [family.id, family]))

  const familyIdsBySpouse = new Map()
  const parentIdsByChild = new Map()

  for (const family of families) {
    for (const spouseId of [family.husbandId, family.wifeId]) {
      if (spouseId == null) continue
      if (!familyIdsBySpouse.has(spouseId)) familyIdsBySpouse.set(spouseId, [])
      const familyIds = familyIdsBySpouse.get(spouseId)
      if (!familyIds.includes(family.id)) familyIds.push(family.id)
    }

    const parentIds = [family.husbandId, family.wifeId].filter((id) => id != null)
    for (const childId of family.childIds ?? []) {
      if (!parentIdsByChild.has(childId)) parentIdsByChild.set(childId, [])
      const childParentIds = parentIdsByChild.get(childId)
      for (const parentId of parentIds) {
        if (!childParentIds.includes(parentId)) childParentIds.push(parentId)
      }
    }
  }

  function familyIdsOf(id) {
    return familyIdsBySpouse.get(id) ?? []
  }

  function childrenOfFamily(familyId) {
    const family = familyById.get(familyId)
    return family?.childIds ?? []
  }

  function parentIdsOf(id) {
    return parentIdsByChild.get(id) ?? []
  }

  function childIdsOf(id) {
    const childIds = []
    for (const familyId of familyIdsOf(id)) {
      for (const childId of childrenOfFamily(familyId)) {
        if (!childIds.includes(childId)) childIds.push(childId)
      }
    }
    return childIds
  }

  function spouseIdsOf(id) {
    const spouseIds = []
    for (const familyId of familyIdsOf(id)) {
      const family = familyById.get(familyId)
      const spouseId = family.husbandId === id ? family.wifeId : family.husbandId
      if (spouseId != null && !spouseIds.includes(spouseId)) spouseIds.push(spouseId)
    }
    return spouseIds
  }

  function roots() {
    return people.filter((person) => parentIdsOf(person.id).length === 0)
  }

  function generations() {
    return [...new Set(people.map((person) => person.generation))].sort((a, b) => a - b)
  }

  function idsInGeneration(generation) {
    return people.filter((person) => person.generation === generation).map((person) => person.id)
  }

  return {
    personById,
    parentIdsOf,
    childIdsOf,
    spouseIdsOf,
    familyIdsOf,
    roots,
    generations,
    idsInGeneration,
    childrenOfFamily
  }
}
