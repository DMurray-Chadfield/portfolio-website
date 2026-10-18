import { useEffect, useMemo, useRef, useState } from "react"
import { computeLayout, edgeToPath } from "../../lib/royalTree/layout.js"
import { fitView, identityView, panBy, zoomAt } from "../../lib/royalTree/panZoom.js"
import { beginDrag, dragDelta, isPrimaryButton } from "../../lib/royalTree/pointerDrag.js"
import TreeNode from "./TreeNode.jsx"

const ZOOM_STEP = 1.1

function TreeCanvas({ data, expandedId, onSelect }) {
  const viewportRef = useRef(null)
  const stopDragRef = useRef(null)
  const fittedRef = useRef(false)
  const [view, setView] = useState(() => identityView())

  const layout = useMemo(() => computeLayout(data, { expandedId }), [data, expandedId])

  const measureViewport = () => {
    const viewport = viewportRef.current
    if (viewport == null) return { width: 0, height: 0 }
    const rect = viewport.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }

  useEffect(() => {
    if (fittedRef.current) return
    if (layout.width <= 0 || layout.height <= 0) return
    const viewport = measureViewport()
    if (viewport.width <= 0 || viewport.height <= 0) return
    setView(fitView(layout, viewport))
    fittedRef.current = true
  }, [layout])

  useEffect(() => {
    const viewport = viewportRef.current
    if (viewport == null) return
    const blockPageScroll = (event) => event.preventDefault()
    viewport.addEventListener("wheel", blockPageScroll, { passive: false })
    return () => viewport.removeEventListener("wheel", blockPageScroll)
  }, [])

  useEffect(() => {
    return () => {
      if (stopDragRef.current != null) stopDragRef.current()
    }
  }, [])

  const handleWheel = (event) => {
    event.preventDefault()
    const viewport = viewportRef.current
    if (viewport == null) return
    const rect = viewport.getBoundingClientRect()
    const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
    setView((current) => zoomAt(current, anchor, factor))
  }

  const stopDrag = () => {
    if (stopDragRef.current == null) return
    stopDragRef.current()
    stopDragRef.current = null
  }

  const handlePointerDown = (event) => {
    if (!isPrimaryButton(event.button) || stopDragRef.current != null) return

    let drag = beginDrag(event)

    const handleMove = (moveEvent) => {
      const delta = dragDelta(drag, moveEvent)
      if (delta == null) return
      if (moveEvent.buttons === 0) {
        stopDrag()
        return
      }
      drag = beginDrag(moveEvent)
      setView((current) => panBy(current, delta.dx, delta.dy))
    }

    const handleEnd = (endEvent) => {
      if (endEvent.pointerId !== drag.pointerId) return
      stopDrag()
    }

    const cleanup = () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleEnd)
      window.removeEventListener("pointercancel", handleEnd)
    }

    stopDragRef.current = cleanup
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleEnd)
    window.addEventListener("pointercancel", handleEnd)
  }

  const zoomBy = (factor) => {
    const viewport = measureViewport()
    const anchor = { x: viewport.width / 2, y: viewport.height / 2 }
    setView((current) => zoomAt(current, anchor, factor))
  }

  const resetView = () => {
    setView(fitView(layout, measureViewport()))
  }

  return (
    <div
      ref={viewportRef}
      className="royal-tree-canvas"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
    >
      <div
        className="royal-tree-controls"
        onWheel={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out">
          -
        </button>
        <button type="button" onClick={resetView} aria-label="Reset view">
          Reset
        </button>
      </div>
      <div
        className="royal-tree-layer"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`
        }}
      >
        <svg
          className="royal-tree-edges"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
        >
          {layout.edges.map((edge) => (
            <path
              key={edge.id}
              className={`royal-tree-edge royal-tree-edge-${edge.kind}`}
              d={edgeToPath(edge)}
            />
          ))}
        </svg>
        {layout.nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            expanded={node.id === expandedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

export default TreeCanvas
