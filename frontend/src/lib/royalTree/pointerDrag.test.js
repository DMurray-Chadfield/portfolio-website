import { describe, it, expect } from "vitest"
import { beginDrag, dragDelta, hasDragged, isPrimaryButton } from "./pointerDrag.js"

describe("pointerDrag", () => {
  it("accepts only the primary mouse button", () => {
    expect(isPrimaryButton(0)).toBe(true)
    expect(isPrimaryButton(1)).toBe(false)
    expect(isPrimaryButton(2)).toBe(false)
  })

  it("records the pointer that started the drag", () => {
    expect(beginDrag({ pointerId: 7, clientX: 10, clientY: 20 })).toEqual({ pointerId: 7, x: 10, y: 20 })
  })

  it("measures movement for the same pointer", () => {
    const drag = beginDrag({ pointerId: 7, clientX: 10, clientY: 20 })
    expect(dragDelta(drag, { pointerId: 7, clientX: 14, clientY: 12 })).toEqual({ dx: 4, dy: -8 })
  })

  it("ignores movement from another pointer and a missing drag", () => {
    const drag = beginDrag({ pointerId: 7, clientX: 10, clientY: 20 })
    expect(dragDelta(drag, { pointerId: 8, clientX: 14, clientY: 12 })).toBeNull()
    expect(dragDelta(null, { pointerId: 7, clientX: 14, clientY: 12 })).toBeNull()
  })

  it("tells a click from a drag by the movement threshold", () => {
    expect(hasDragged({ x: 10, y: 20 }, { x: 12, y: 18 })).toBe(false)
    expect(hasDragged({ x: 10, y: 20 }, { x: 10, y: 25 })).toBe(false)
    expect(hasDragged({ x: 10, y: 20 }, { x: 16, y: 20 })).toBe(true)
    expect(hasDragged({ x: 10, y: 20 }, { x: 10, y: 26 }, 6)).toBe(false)
  })
})
