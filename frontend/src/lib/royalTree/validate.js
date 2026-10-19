export const MONARCH_IDS = [
  "aethelbald",
  "aethelberht",
  "aethelred1",
  "aethelred2",
  "aethelstan",
  "aethelwulf",
  "alfred",
  "anne",
  "charles1",
  "charles2",
  "charles3",
  "eadred",
  "eadwig",
  "ealhmund",
  "ecgberht",
  "edgar",
  "edmund1",
  "edmund2",
  "edward-confessor",
  "edward-elder",
  "edward-martyr",
  "edward1",
  "edward2",
  "edward3",
  "edward4",
  "edward5",
  "edward6",
  "edward7",
  "edward8",
  "elizabeth1",
  "elizabeth2",
  "george1",
  "george2",
  "george3",
  "george4",
  "george5",
  "george6",
  "henry1",
  "henry2",
  "henry3",
  "henry4",
  "henry5",
  "henry6",
  "henry7",
  "henry8",
  "james1",
  "james2",
  "john",
  "mary1",
  "mary2",
  "richard1",
  "richard2",
  "richard3",
  "stephen",
  "victoria",
  "william1",
  "william2",
  "william3",
  "william4"
]

export function validateTree(data) {
  const problems = []
  const people = data?.people ?? []
  const families = data?.families ?? []

  const personIds = new Set()
  for (const person of people) {
    if (personIds.has(person.id)) problems.push(`duplicate person id ${person.id}`)
    personIds.add(person.id)
  }

  const familyIds = new Set()
  for (const family of families) {
    if (familyIds.has(family.id)) problems.push(`duplicate family id ${family.id}`)
    familyIds.add(family.id)
  }

  const resolve = (family, field, id) => {
    if (id == null) return
    if (!personIds.has(id)) problems.push(`family ${family.id} ${field} ${id} does not match any person`)
  }

  const inAnyFamily = new Set()
  for (const family of families) {
    resolve(family, "husbandId", family.husbandId)
    resolve(family, "wifeId", family.wifeId)
    if (family.husbandId != null) inAnyFamily.add(family.husbandId)
    if (family.wifeId != null) inAnyFamily.add(family.wifeId)
    for (const childId of family.childIds ?? []) {
      resolve(family, "childId", childId)
      inAnyFamily.add(childId)
    }
  }

  for (const person of people) {
    if (!Number.isInteger(person.generation)) {
      problems.push(`person ${person.id} is missing an integer generation`)
    }
    if (person.kind === "monarch") {
      for (const field of ["name", "house", "reign", "summary"]) {
        if (typeof person[field] !== "string" || person[field].trim() === "") {
          problems.push(`person ${person.id} has no ${field}`)
        }
      }
    }
    if (!inAnyFamily.has(person.id)) {
      problems.push(`person ${person.id} is absent from every family (orphan check, informational)`)
    }
  }

  return problems
}
