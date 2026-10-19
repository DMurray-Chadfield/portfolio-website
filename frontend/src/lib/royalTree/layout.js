import { buildGraph } from "./graph.js"

export const NODE_W = 140
export const NODE_H = 44
export const CARD_W = 340
export const CARD_H = 240
export const SPOUSE_GAP = 24
export const SIBLING_GAP = 24
export const ROW_GAP = 72
export const MARGIN = 48

function keepsWalk(graph, id, rootSpouseIds) {
  const coupleIds = [id, ...rootSpouseIds]
  const monarchIds = coupleIds.filter((other) => graph.personById.get(other).kind === "monarch")
  if (monarchIds.length === 1) return graph.personById.get(id).kind === "monarch"
  return graph.personById.get(id).sex !== "female"
}

function deferredRoots(graph) {
  const rootIds = new Set(graph.roots().map((person) => person.id))
  const deferred = new Set()
  for (const id of rootIds) {
    const spouseIds = graph.spouseIdsOf(id)
    if (spouseIds.length === 0) continue
    if (spouseIds.some((spouseId) => deferred.has(spouseId))) continue
    const rootSpouseIds = spouseIds.filter((spouseId) => rootIds.has(spouseId))
    if (rootSpouseIds.length > 0 && keepsWalk(graph, id, rootSpouseIds)) continue
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

function spouseAndPartner(graph, seq, a, b) {
  const ownA = seq.has(a)
  const ownB = seq.has(b)
  if (ownA !== ownB) return ownA ? [b, a] : [a, b]
  return graph.personById.get(a).sex === "female" ? [a, b] : [b, a]
}

export function orderRow(graph, ids) {
  const seq = sequenceNumbers(graph)
  const seqOf = makeSeqOf(graph, seq)
  let ordered = [...ids].sort((a, b) => seqOf(a) - seqOf(b))

  for (const [a, b] of couplesIn(graph, ordered)) {
    const [spouse, partner] = spouseAndPartner(graph, seq, a, b)
    const shared = sharedChildrenOf(graph, partner, spouse)
    let side = "right"
    if (shared.length > 0) {
      const mean = shared.reduce((sum, id) => sum + seqOf(id), 0) / shared.length
      if (mean <= seqOf(partner)) side = "left"
    }
    const without = ordered.filter((id) => id !== spouse)
    const at = without.indexOf(partner)
    without.splice(side === "right" ? at + 1 : at, 0, spouse)
    ordered = without
  }

  return ordered
}

export function placeNodes(graph, { expandedId = null, expandedHeight = null } = {}) {
  const widthOf = (id) => (id === expandedId ? CARD_W : NODE_W)
  const heightOf = (id) => (id === expandedId ? expandedHeight ?? CARD_H : NODE_H)

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
      let prev = null
      for (const id of row) {
        const gap = prev != null && areSpouses(graph, prev, id) ? SPOUSE_GAP : SIBLING_GAP
        const min = prev == null ? -Infinity : xById.get(prev) + widthOf(prev) + gap
        xById.set(id, Math.max(targets.get(id), min))
        prev = id
      }
    }
  }

  for (const related of [graph.childIdsOf, graph.parentIdsOf, graph.childIdsOf, graph.parentIdsOf]) {
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

export function buildEdges(graph, nodes) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const rowBottomByY = new Map()
  for (const node of nodes) rowBottomByY.set(node.y, Math.max(rowBottomByY.get(node.y) ?? 0, node.y + node.h))

  const parentsByFamily = new Map()
  for (const node of nodes) {
    for (const familyId of graph.familyIdsOf(node.id)) {
      if (!parentsByFamily.has(familyId)) parentsByFamily.set(familyId, [])
      parentsByFamily.get(familyId).push(node)
    }
  }

  const centreX = (node) => node.x + node.w / 2
  const chipCentreY = (node) => node.y + NODE_H / 2
  const edges = []
  for (const [familyId, parents] of parentsByFamily) {
    const [left, right] = [...parents].sort((a, b) => a.x - b.x)
    const childIds = graph.childrenOfFamily(familyId)
    const children = childIds.map((id) => nodeById.get(id)).filter((node) => node != null)

    let junction = null
    if (parents.length === 2) {
      const y = (chipCentreY(left) + chipCentreY(right)) / 2
      const a = { x: left.x + left.w, y }
      const b = { x: right.x, y }
      junction = { x: (a.x + b.x) / 2, y }
      const dot = childIds.length > 0 ? junction : null
      edges.push({ id: `marriage:${familyId}`, kind: "marriage", familyId, a, b, dot })
    }

    if (children.length > 0) {
      const stemTop = junction ?? { x: centreX(parents[0]), y: parents[0].y + parents[0].h }
      const parentsBottom = Math.max(...parents.map((parent) => rowBottomByY.get(parent.y)))
      const childrenTop = Math.min(...children.map((child) => child.y))
      const barY = (parentsBottom + childrenTop) / 2
      const childXs = children.map(centreX)
      edges.push({
        id: `blood:${familyId}`,
        kind: "blood",
        familyId,
        stemTop,
        barY,
        barLeft: Math.min(...childXs, stemTop.x),
        barRight: Math.max(...childXs, stemTop.x),
        drops: children.map((child) => ({ x: centreX(child), y1: barY, y2: child.y }))
      })
    }
  }
  return edges
}

export function edgeToPath(edge) {
  if (edge.kind === "marriage") return `M${edge.a.x} ${edge.a.y} H${edge.b.x}`
  const parts = [
    `M${edge.stemTop.x} ${edge.stemTop.y} V${edge.barY}`,
    `M${edge.barLeft} ${edge.barY} H${edge.barRight}`
  ]
  for (const drop of edge.drops) parts.push(`M${drop.x} ${drop.y1} V${drop.y2}`)
  return parts.join(" ")
}

export function computeLayout(data, { expandedId = null, expandedHeight = null } = {}) {
  const graph = buildGraph(data)
  const { nodes, width, height } = placeNodes(graph, { expandedId, expandedHeight })
  return { nodes, edges: buildEdges(graph, nodes), width, height }
}
