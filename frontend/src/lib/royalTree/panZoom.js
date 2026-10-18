const MIN_SCALE = 0.25
const MAX_SCALE = 2.5
const DEFAULT_PADDING = 48

export function identityView() {
  return { x: 0, y: 0, k: 1 }
}

export function clampScale(k, min = MIN_SCALE, max = MAX_SCALE) {
  return Math.min(Math.max(k, min), max)
}

export function panBy(view, dx, dy) {
  return { x: view.x + dx, y: view.y + dy, k: view.k }
}

export function zoomAt(view, anchor, factor, limits = {}) {
  const k = clampScale(view.k * factor, limits.min, limits.max)
  const ratio = k / view.k
  return {
    x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio,
    k
  }
}

export function fitView(content, viewport, padding = DEFAULT_PADDING) {
  const k = clampScale(
    Math.min((viewport.width - 2 * padding) / content.width, (viewport.height - 2 * padding) / content.height)
  )
  return {
    x: (viewport.width - content.width * k) / 2,
    y: (viewport.height - content.height * k) / 2,
    k
  }
}
