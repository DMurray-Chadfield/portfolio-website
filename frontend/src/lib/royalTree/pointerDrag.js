export function isPrimaryButton(button) {
  return button === 0
}

export function beginDrag(pointer) {
  return { pointerId: pointer.pointerId, x: pointer.clientX, y: pointer.clientY }
}

export function dragDelta(drag, pointer) {
  if (drag == null || pointer.pointerId !== drag.pointerId) return null
  return { dx: pointer.clientX - drag.x, dy: pointer.clientY - drag.y }
}

export function hasDragged(start, end, threshold = 5) {
  return Math.abs(end.x - start.x) > threshold || Math.abs(end.y - start.y) > threshold
}
