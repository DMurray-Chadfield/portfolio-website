import { describe, it, expect } from "vitest"
import { easeInOut, tweenLayout } from "./tween.js"

const from = {
  nodes: [
    { id: "a", kind: "monarch", x: 0, y: 0, w: 140, h: 44, person: { id: "a" } },
    { id: "b", kind: "connector", x: 164, y: 0, w: 140, h: 44, person: { id: "b" } }
  ],
  edges: [
    { id: "marriage:f", kind: "marriage", familyId: "f", a: { x: 140, y: 22 }, b: { x: 164, y: 22 }, dot: { x: 152, y: 22 } },
    {
      id: "blood:f",
      kind: "blood",
      familyId: "f",
      stemTop: { x: 152, y: 22 },
      barY: 80,
      barLeft: 70,
      barRight: 234,
      drops: [{ x: 70, y1: 80, y2: 116 }, { x: 234, y1: 80, y2: 116 }]
    }
  ],
  width: 352,
  height: 200
}

const to = {
  nodes: [
    { id: "a", kind: "monarch", x: 0, y: 0, w: 340, h: 300, person: { id: "a" } },
    { id: "b", kind: "connector", x: 364, y: 0, w: 140, h: 44, person: { id: "b" } }
  ],
  edges: [
    { id: "marriage:f", kind: "marriage", familyId: "f", a: { x: 340, y: 22 }, b: { x: 364, y: 22 }, dot: { x: 352, y: 22 } },
    {
      id: "blood:f",
      kind: "blood",
      familyId: "f",
      stemTop: { x: 352, y: 22 },
      barY: 370,
      barLeft: 170,
      barRight: 434,
      drops: [{ x: 170, y1: 370, y2: 440 }, { x: 434, y1: 370, y2: 440 }]
    }
  ],
  width: 552,
  height: 500
}

describe("tweenLayout", () => {
  it("eases from 0 to 1", () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
    expect(easeInOut(0.25)).toBeLessThan(0.25)
    expect(easeInOut(0.75)).toBeGreaterThan(0.75)
  })

  it("returns the endpoints unchanged", () => {
    expect(tweenLayout(from, to, 0)).toBe(from)
    expect(tweenLayout(from, to, 1)).toBe(to)
  })

  it("interpolates node geometry midway", () => {
    const mid = tweenLayout(from, to, 0.5)
    expect(mid.nodes[0].w).toBe(240)
    expect(mid.nodes[0].h).toBe(172)
    expect(mid.nodes[1].x).toBe(264)
    expect(mid.width).toBe(452)
    expect(mid.nodes[0].person).toBe(to.nodes[0].person)
    expect(mid.nodes[0].id).toBe("a")
  })

  it("interpolates edge geometry midway", () => {
    const mid = tweenLayout(from, to, 0.5)
    expect(mid.edges[0].a.x).toBe(240)
    expect(mid.edges[0].dot.x).toBe(252)
    expect(mid.edges[1].stemTop.y).toBe(22)
    expect(mid.edges[1].barY).toBe(225)
    expect(mid.edges[1].drops[1].x).toBe(334)
    expect(mid.edges[1].drops).toHaveLength(2)
  })

  it("snaps to the target when the shapes differ", () => {
    const other = { ...to, nodes: to.nodes.slice(0, 1), edges: [] }
    expect(tweenLayout(from, other, 0.5)).toBe(other)
  })
})
