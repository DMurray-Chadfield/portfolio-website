export const TWEEN_MS = 200

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpPoint(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

function sameIds(a, b) {
  return a.length === b.length && a.every((item, i) => item.id === b[i].id)
}

function tweenEdge(from, to, t) {
  if (from.kind === "marriage" && to.kind === "marriage") {
    return {
      ...to,
      a: lerpPoint(from.a, to.a, t),
      b: lerpPoint(from.b, to.b, t),
      dot: from.dot == null || to.dot == null ? to.dot : lerpPoint(from.dot, to.dot, t)
    }
  }
  if (from.kind === "blood" && to.kind === "blood" && from.drops.length === to.drops.length) {
    return {
      ...to,
      stemTop: lerpPoint(from.stemTop, to.stemTop, t),
      barY: lerp(from.barY, to.barY, t),
      barLeft: lerp(from.barLeft, to.barLeft, t),
      barRight: lerp(from.barRight, to.barRight, t),
      drops: to.drops.map((drop, i) => ({
        x: lerp(from.drops[i].x, drop.x, t),
        y1: lerp(from.drops[i].y1, drop.y1, t),
        y2: lerp(from.drops[i].y2, drop.y2, t)
      }))
    }
  }
  return to
}

export function tweenLayout(from, to, t) {
  if (t >= 1) return to
  if (t <= 0) return from
  if (!sameIds(from.nodes, to.nodes) || !sameIds(from.edges, to.edges)) return to
  return {
    nodes: to.nodes.map((node, i) => ({
      ...node,
      x: lerp(from.nodes[i].x, node.x, t),
      y: lerp(from.nodes[i].y, node.y, t),
      w: lerp(from.nodes[i].w, node.w, t),
      h: lerp(from.nodes[i].h, node.h, t)
    })),
    edges: to.edges.map((edge, i) => tweenEdge(from.edges[i], edge, t)),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t)
  }
}
