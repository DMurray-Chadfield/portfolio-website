import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { computeLayout, edgeToPath } from "../../lib/royalTree/layout.js"
import { fitView, identityView, panBy, zoomAt } from "../../lib/royalTree/panZoom.js"
import { beginDrag, dragDelta, hasDragged, isPrimaryButton } from "../../lib/royalTree/pointerDrag.js"
import { TWEEN_MS, easeInOut, tweenLayout } from "../../lib/royalTree/tween.js"
import TreeNode from "./TreeNode.jsx"

const ZOOM_STEP = 1.1

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function TreeCanvas({ data, expandedId, onSelect }) {
  const viewportRef = useRef(null)
  const stopDragRef = useRef(null)
  const fittedRef = useRef(false)
  const cardRef = useRef(null)
  const downPosRef = useRef(null)
  const displayRef = useRef(null)
  const rafRef = useRef(null)
  const [view, setView] = useState(() => identityView())
  const [cardHeights, setCardHeights] = useState({})

  const layout = useMemo(
    () => computeLayout(data, { expandedId, expandedHeight: cardHeights[expandedId] }),
    [data, expandedId, cardHeights]
  )

  const [display, setDisplay] = useState(() => layout)
  const [animating, setAnimating] = useState(false)
  displayRef.current = display

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

  useLayoutEffect(() => {
    const card = cardRef.current
    if (card == null) return
    const height = card.offsetHeight
    if (height <= 0) return
    setCardHeights((current) => (current[expandedId] === height ? current : { ...current, [expandedId]: height }))
  }, [expandedId])

  useEffect(() => {
    const target = layout
    const previous = displayRef.current
    if (previous === target) return undefined
    if (prefersReducedMotion()) {
      displayRef.current = target
      setDisplay(target)
      setAnimating(false)
      return undefined
    }
    const start = performance.now()
    setAnimating(true)
    const step = () => {
      const t = Math.min((performance.now() - start) / TWEEN_MS, 1)
      const next = tweenLayout(previous, target, easeInOut(t))
      displayRef.current = next
      setDisplay(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
        setAnimating(false)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
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

    downPosRef.current = { x: event.clientX, y: event.clientY }
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

  const handleClick = (event) => {
    const down = downPosRef.current
    downPosRef.current = null
    if (down == null) return
    if (hasDragged(down, { x: event.clientX, y: event.clientY })) return
    if (event.target.closest(".royal-tree-node, .royal-tree-controls") != null) return
    if (expandedId != null) onSelect(null)
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
      onClick={handleClick}
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
          width: display.width,
          height: display.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`
        }}
      >
        <svg
          className="royal-tree-edges"
          width={display.width}
          height={display.height}
          aria-hidden="true"
        >
          {display.edges.map((edge) => (
            <path
              key={edge.id}
              className={`royal-tree-edge royal-tree-edge-${edge.kind}`}
              d={edgeToPath(edge)}
            />
          ))}
          {display.edges.map((edge) => (
            edge.dot == null ? null : (
              <circle
                key={`dot:${edge.id}`}
                className="royal-tree-dot"
                cx={edge.dot.x}
                cy={edge.dot.y}
                r={4}
              />
            )
          ))}
        </svg>
        {display.nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            expanded={node.id === expandedId}
            onSelect={onSelect}
            animating={animating}
            cardRef={node.id === expandedId ? cardRef : null}
          />
        ))}
      </div>
    </div>
  )
}

export default TreeCanvas
