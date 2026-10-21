import { describe, it, expect } from "vitest"
import { identityView, clampScale, panBy, zoomAt, fitView } from "./panZoom.js"

describe("panZoom", () => {
  it("starts at identity", () => {
    expect(identityView()).toEqual({ x: 0, y: 0, k: 1 })
  })

  it("clamps scale to the limits", () => {
    expect(clampScale(10)).toBe(2.5)
    expect(clampScale(0.01)).toBe(0.25)
    expect(clampScale(1.5)).toBe(1.5)
  })

  it("pans by a delta", () => {
    expect(panBy({ x: 0, y: 0, k: 1 }, 10, -5)).toEqual({ x: 10, y: -5, k: 1 })
  })

  it("keeps the world point under the anchor fixed while zooming", () => {
    const anchor = { x: 200, y: 150 }
    const before = identityView()
    const base = { wx: (anchor.x - before.x) / before.k, wy: (anchor.y - before.y) / before.k }
    const after = zoomAt(before, anchor, 2)
    expect(after.k).toBe(2)
    expect(base.wx * after.k + after.x).toBeCloseTo(anchor.x)
    expect(base.wy * after.k + after.y).toBeCloseTo(anchor.y)
  })

  it("does not exceed the scale cap when zooming in hard", () => {
    const v = zoomAt(identityView(), { x: 0, y: 0 }, 100)
    expect(v.k).toBe(2.5)
  })

  it("fits and centres content in a viewport", () => {
    const v = fitView({ width: 400, height: 200 }, { width: 1000, height: 600 })
    expect(v.k).toBeLessThanOrEqual(2.5)
    expect(v.x).toBeCloseTo((1000 - 400 * v.k) / 2)
    expect(v.y).toBeCloseTo((600 - 200 * v.k) / 2)
  })

  it("fits tall content below the wheel-zoom floor and keeps every edge inside", () => {
    const content = { width: 1220, height: 4664 }
    const viewport = { width: 1000, height: 700 }
    const v = fitView(content, viewport)
    expect(v.k).toBeLessThan(0.25)
    expect(v.k).toBeGreaterThanOrEqual(0.05)
    expect(v.x).toBeGreaterThanOrEqual(0)
    expect(v.y).toBeGreaterThanOrEqual(0)
    expect(v.x + content.width * v.k).toBeLessThanOrEqual(viewport.width)
    expect(v.y + content.height * v.k).toBeLessThanOrEqual(viewport.height)
  })

  it("does not snap a fitted sub-floor scale up when zooming out", () => {
    const fitted = fitView({ width: 1220, height: 4664 }, { width: 1000, height: 700 })
    const after = zoomAt(fitted, { x: 500, y: 350 }, 1 / 1.1)
    expect(after.k).toBe(fitted.k)
  })

  it("still keeps the wheel-zoom floor at 0.25 when zooming out from above it", () => {
    const v = zoomAt({ x: 0, y: 0, k: 0.3 }, { x: 100, y: 100 }, 1 / 10)
    expect(v.k).toBe(0.25)
  })
})
