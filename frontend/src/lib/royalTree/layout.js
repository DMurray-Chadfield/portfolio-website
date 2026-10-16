export const NODE_W = 140
export const NODE_H = 44
export const CARD_W = 340
export const CARD_H = 240
export const SPOUSE_GAP = 24
export const SIBLING_GAP = 24
export const ROW_GAP = 72
export const MARGIN = 48

function deferredRoots(graph) {
  const rootIds = new Set(graph.roots().map((person) => person.id))
  const deferred = new Set()
  for (const id of rootIds) {
    const spouseIds = graph.spouseIdsOf(id)
    if (spouseIds.length === 0) continue
    if (spouseIds.some((spouseId) => deferred.has(spouseId))) continue
    const coupleOfRoots = spouseIds.some((spouseId) => rootIds.has(spouseId))
    if (coupleOfRoots && graph.personById.get(id).sex !== "female") continue
    deferred.add(id)
  }
  return deferred
}

function sequenceNumbers(graph) {
  const deferred = deferredRoots(graph)
  const seq = new Map()
  let next = 0

  const visit = (id) => {
    if (seq.has(id)) return
    seq.set(id, next++)
    const childIds = [...graph.childIdsOf(id)]
    for (const spouseId of graph.spouseIdsOf(id)) {
      if (!deferred.has(spouseId)) continue
      for (const childId of graph.childIdsOf(spouseId)) {
        if (!childIds.includes(childId)) childIds.push(childId)
      }
    }
    for (const childId of childIds) visit(childId)
  }

  for (const root of graph.roots()) {
    if (deferred.has(root.id)) continue
    visit(root.id)
  }
  return seq
}

function makeSeqOf(graph, seq) {
  return (id) => {
    if (seq.has(id)) return seq.get(id)
    for (const spouseId of graph.spouseIdsOf(id)) {
      if (seq.has(spouseId)) return seq.get(spouseId)
    }
    return Number.MAX_SAFE_INTEGER
  }
}

function areSpouses(graph, a, b) {
  return graph.spouseIdsOf(a).includes(b)
}

function sharedChildrenOf(graph, a, b) {
  const childrenOfB = new Set(graph.childIdsOf(b))
  return graph.childIdsOf(a).filter((childId) => childrenOfB.has(childId))
}

function couplesIn(graph, ids) {
  const present = new Set(ids)
  const couples = []
  const seen = new Set()
  for (const id of ids) {
    for (const spouseId of graph.spouseIdsOf(id)) {
      if (!present.has(spouseId)) continue
      const key = [id, spouseId].sort().join("\u0000")
      if (seen.has(key)) continue
      seen.add(key)
      couples.push([id, spouseId])
    }
  }
  return couples
}

function spouseAndPartner(graph, seq, x, y) {
  const ownX = seq.has(x)
  const ownY = seq.has(y)
  if (ownX !== ownY) return ownX ? [y, x] : [x, y]
  return graph.personById.get(x).sex === "female" ? [x, y] : [y, x]
}

export function orderRow(graph, ids) {
  const seq = sequenceNumbers(graph)
  const seqOf = makeSeqOf(graph, seq)
  const ordered = [...ids].sort((a, b) => seqOf(a) - seqOf(b))

  for (const [x, y] of couplesIn(graph, ordered)) {
    const [spouse, partner] = spouseAndPartner(graph, seq, x, y)
    const shared = sharedChildrenOf(graph, partner, spouse)
    let side = "right"
    if (shared.length > 0) {
      const mean = shared.reduce((sum, id) => sum + seqOf(id), 0) / shared.length
      if (mean <= seqOf(partner)) side = "left"
    }
    const without = ordered.filter((id) => id !== spouse)
    const at = without.indexOf(partner)
    without.splice(side === "right" ? at + 1 : at, 0, spouse)
    ordered.splice(0, ordered.length, ...without)
  }

  return ordered
}

export function placeNodes(graph, { expandedId = null } = {}) {
  const widthOf = (id) => (id === expandedId ? CARD_W : NODE_W)
  const heightOf = (id) => (id === expandedId ? CARD_H : NODE_H)

  const rows = graph
    .generations()
    .map((generation) => orderRow(graph, graph.idsInGeneration(generation)))
    .filter((ids) => ids.length > 0)

  const xById = new Map()
  const yById = new Map()
  let y = 0
  for (const ids of rows) {
    let x = 0
    let prev = null
    for (const id of ids) {
      if (prev != null) x += areSpouses(graph, prev, id) ? SPOUSE_GAP : SIBLING_GAP
      xById.set(id, x)
      x += widthOf(id)
      prev = id
    }
    for (const id of ids) yById.set(id, y)
    y += Math.max(...ids.map(heightOf)) + ROW_GAP
  }

  const ids = rows.flat()
  const respaced = (targets) => {
    for (const row of rows) {
      const sorted = [...row].sort((a, b) => targets.get(a) - targets.get(b))
      let prev = null
      for (const id of sorted) {
        const gap = prev != null && areSpouses(graph, prev, id) ? SPOUSE_GAP : SIBLING_GAP
        const min = prev == null ? -Infinity : xById.get(prev) + widthOf(prev) + gap
        xById.set(id, Math.max(targets.get(id), min))
        prev = id
      }
    }
  }

  const relatedTo = {
    up: (id) => graph.childIdsOf(id),
    down: (id) => graph.parentIdsOf(id)
  }
  for (const direction of ["up", "down", "up", "down"]) {
    const related = relatedTo[direction]
    const targets = new Map(
      ids.map((id) => {
        const relatedIds = related(id).filter((other) => xById.has(other))
        const target = relatedIds.length === 0
          ? xById.get(id)
          : relatedIds.reduce((sum, other) => sum + xById.get(other), 0) / relatedIds.length
        return [id, target]
      })
    )
    respaced(targets)
  }

  const minX = Math.min(...ids.map((id) => xById.get(id)))
  const minY = Math.min(...ids.map((id) => yById.get(id)))
  for (const id of ids) {
    xById.set(id, xById.get(id) - minX + MARGIN)
    yById.set(id, yById.get(id) - minY + MARGIN)
  }

  const nodes = ids.map((id) => {
    const person = graph.personById.get(id)
    return {
      id,
      kind: person.kind,
      sex: person.sex,
      x: xById.get(id),
      y: yById.get(id),
      w: widthOf(id),
      h: heightOf(id),
      person
    }
  })

  return {
    nodes,
    width: Math.max(...nodes.map((node) => node.x + node.w)) + MARGIN,
    height: Math.max(...nodes.map((node) => node.y + node.h)) + MARGIN
  }
}
