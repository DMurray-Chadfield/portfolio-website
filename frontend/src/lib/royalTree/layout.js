import { buildGraph } from "./graph.js"
import { buildClusters } from "./clusters.js"

export const NODE_W = 140
export const NODE_H = 44
export const CARD_W = 340
export const CARD_H = 240
export const SPOUSE_GAP = 24
export const SIBLING_GAP = 24
export const ROW_GAP = 72
export const LANE_GAP = 8
export const MARGIN = 48

function placeClusters(graph, { expandedId = null } = {}) {
  const widthOf = (id) => (id === expandedId ? CARD_W : NODE_W)
  const { clusterById, clusterIdOfPerson, rootClusterIds } = buildClusters(graph)

  const homeChildClusters = (cluster) => {
    const byCluster = new Map()
    for (const childId of cluster.childIds) {
      const childClusterId = clusterIdOfPerson.get(childId)
      const childCluster = childClusterId == null ? null : clusterById.get(childClusterId)
      if (childCluster?.birthClusterId !== cluster.id) continue
      if (!byCluster.has(childCluster.id)) byCluster.set(childCluster.id, { clusterId: childCluster.id, childIds: [] })
      byCluster.get(childCluster.id).childIds.push(childId)
    }
    return [...byCluster.values()]
  }

  const chipsWidthOf = (cluster) =>
    cluster.memberIds.reduce((sum, memberId, index) => sum + widthOf(memberId) + (index > 0 ? SPOUSE_GAP : 0), 0)

  const layoutRelative = (clusterId) => {
    const cluster = clusterById.get(clusterId)
    const homeChildren = homeChildClusters(cluster)
    const positions = new Map()
    const childDrops = []
    let cursor = 0

    for (const child of homeChildren) {
      const childLayout = layoutRelative(child.clusterId)
      for (const [id, x] of childLayout.positions) positions.set(id, x + cursor)
      for (const childId of child.childIds) childDrops.push(positions.get(childId) + widthOf(childId) / 2)
      cursor += childLayout.maxX + SIBLING_GAP
    }

    const chipsWidth = chipsWidthOf(cluster)
    const anchor = childDrops.length > 0
      ? (Math.min(...childDrops) + Math.max(...childDrops)) / 2
      : chipsWidth / 2
    let chipX = anchor - chipsWidth / 2
    const chipLeft = chipX
    for (const memberId of cluster.memberIds) {
      positions.set(memberId, chipX)
      chipX += widthOf(memberId) + SPOUSE_GAP
    }
    const chipRight = chipX - SPOUSE_GAP
    const childrenRight = homeChildren.length > 0 ? cursor - SIBLING_GAP : -Infinity
    const shift = -Math.min(chipLeft, 0)
    for (const [id, x] of positions) positions.set(id, x + shift)
    return { positions, maxX: Math.max(chipRight, childrenRight) + shift }
  }

  const xById = new Map()
  let cursor = 0
  for (const rootClusterId of rootClusterIds) {
    const root = layoutRelative(rootClusterId)
    for (const [id, x] of root.positions) xById.set(id, x + cursor)
    cursor += root.maxX + SIBLING_GAP
  }

  return xById
}

export function placeNodes(graph, { expandedId = null, expandedHeight = null } = {}) {
  const widthOf = (id) => (id === expandedId ? CARD_W : NODE_W)
  const heightOf = (id) => (id === expandedId ? expandedHeight ?? CARD_H : NODE_H)

  const xById = placeClusters(graph, { expandedId })
  const generations = graph.generations()
  const rows = generations.map((generation) => graph.idsInGeneration(generation)).filter((ids) => ids.length > 0)

  const yById = new Map()
  let y = 0
  for (const generation of generations) {
    const ids = graph.idsInGeneration(generation)
    if (ids.length === 0) continue
    for (const id of ids) yById.set(id, y)
    y += Math.max(...ids.map(heightOf)) + ROW_GAP
  }

  const ids = rows.flat()
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
  const bloodEntries = []
  for (const [familyId, parents] of parentsByFamily) {
    const parentIds = parents.map((parent) => parent.id)
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
      const edge = {
        id: `blood:${familyId}`,
        kind: "blood",
        familyId,
        stemTop,
        barY,
        barLeft: Math.min(...childXs, stemTop.x),
        barRight: Math.max(...childXs, stemTop.x),
        drops: children.map((child) => ({ x: centreX(child), y1: barY, y2: child.y }))
      }
      edges.push(edge)
      bloodEntries.push({ edge, parentIds, parentsBottom, childrenTop, baseBarY: barY })
    }
  }

  const lanesByGutter = new Map()
  const shareParent = (a, b) => a.some((id) => b.includes(id))
  for (const entry of bloodEntries) {
    const key = `${entry.parentsBottom}|${entry.childrenTop}`
    if (!lanesByGutter.has(key)) lanesByGutter.set(key, [])
    const lanes = lanesByGutter.get(key)
    const offsets = laneOffsets(entry.parentsBottom, entry.childrenTop)
    let lane = null
    for (let candidate = 0; candidate < offsets.length; candidate += 1) {
      const occupied = lanes.filter((other) => other.lane === candidate)
      const fitsBars = occupied.every(
        (other) =>
          shareParent(entry.parentIds, other.parentIds) ||
          entry.edge.barRight < other.barLeft ||
          other.barRight < entry.edge.barLeft
      )
      if (!fitsBars) continue
      lane = candidate
      break
    }
    if (lane == null) {
      lane = 0
      console.warn(`royal tree: no lane fits ${entry.edge.id} in its gutter`)
    }
    const barY = entry.baseBarY + offsets[lane]
    lanes.push({ lane, barLeft: entry.edge.barLeft, barRight: entry.edge.barRight, parentIds: entry.parentIds })
    entry.edge.barY = barY
    for (const drop of entry.edge.drops) drop.y1 = barY
  }

  return edges
}

function laneOffsets(parentsBottom, childrenTop) {
  const middle = (parentsBottom + childrenTop) / 2
  const offsets = [0]
  for (let step = 1; ; step += 1) {
    const distance = step * LANE_GAP
    const up = middle + distance <= childrenTop - 6
    const down = middle - distance >= parentsBottom + 6
    if (!up && !down) break
    if (up) offsets.push(distance)
    if (down) offsets.push(-distance)
  }
  return offsets
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
