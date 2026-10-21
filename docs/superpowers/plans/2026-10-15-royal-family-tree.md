# Royal Family Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a zoomable, clickable family tree of the English royal line (Ealhmund of Kent to Charles III) as a new page in the existing React frontend.

**Architecture:** Data-driven and dependency-free. A JSON file describes people and families; pure JS modules build the graph, compute a layered pedigree layout, produce edge geometry, and handle pan/zoom maths; React components render that layout into a transformed canvas and expand a clicked monarch's node into a fact card. Positions are computed, never authored.

**Tech Stack:** React 18, React Router 6, Vite 6, plain JS/JSX (no TypeScript). New dev dependency: `vitest` only. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-15-royal-family-tree-design.md` — the plan argues from the spec, so read both. Where this plan pins a value the spec left open (row heights, chip sizes, the exact ordering rule), this plan wins.

## Global Constraints

- Plain JavaScript and JSX. No TypeScript.
- Match existing frontend style: no semicolons, double quotes, 2-space indent, function components, default-exported pages.
- **No new runtime dependencies.** Dev-only: `vitest`.
- Public route `/family-tree`, **not** wrapped in `ProtectedRoute`.
- Data is a static JSON import (`import data from "..."`); no fetch, no backend.
- Node labels use the ASCII spellings from the spec (`Aethelred II`, `Ecgberht`).
- Only line-carrying spouses are drawn; a person may appear in more than one family.
- No highlighting of any kind (no hover lineage, no active-line emphasis).
- A monarch's node expands **in place** and the tree reflows around it.

## Review Focus

Inputs and conditions the spec implies but no task's happy-path tests exercise. Each line gets a test in the task that owns the code (task noted).

1. **A missing portrait** — the card must show a monogram fallback, never a broken image (Task 8).
2. **A person in two families** (Emma of Normandy, Aethelred II) — must render exactly one node, and their two families must produce two separate sibling bars (Tasks 1, 3).
3. **A person with no parents** (Ealhmund, Richard the Fearless) — a valid root, not a crash; multiple roots must coexist (Tasks 1, 2).
4. **Sparse generations** (e.g. rows 2, 3, 7, 8) — empty generations must collapse so there is no blank band (Task 2).
5. **Empty predecessor/successor** (Ealhmund has no predecessor; Charles III has no successor) and a predecessor who is not in the tree (William I's is Harold II) — the card must render the name when present in the data and a dash when absent (Task 5).

---

## File Structure

```
frontend/
├── package.json                                  (modify: vitest + test script)
├── public/portraits/<person-id>.jpg              (create: Task 8)
└── src/
    ├── index.css                                 (modify: .royal-tree-* styles)
    ├── data/royalFamilyTree.json                 (create: Tasks 1, 7)
    ├── lib/royalTree/
    │   ├── graph.js                              (create: Task 1)
    │   ├── graph.test.js
    │   ├── layout.js                             (create: Tasks 2, 3)
    │   ├── layout.test.js
    │   ├── panZoom.js                            (create: Task 4)
    │   ├── panZoom.test.js
    │   ├── validate.js                           (create: Task 7)
    │   └── validate.test.js
    ├── pages/royalTree/
    │   ├── RoyalTreePage.jsx                     (create: Task 6)
    │   ├── RoyalTreePage.test.jsx
    │   ├── TreeCanvas.jsx                        (create: Task 5)
    │   ├── TreeCanvas.test.jsx
    │   ├── TreeNode.jsx                          (create: Task 5)
    │   ├── TreeNode.test.jsx
    │   ├── FactCard.jsx                          (create: Task 5)
    │   └── FactCard.test.jsx
    ├── App.jsx                                   (modify: route)
    ├── components/Navbar.jsx                     (modify: link)
    └── pages/LandingPage.jsx                     (modify: tool card)
```

Component tests use `renderToStaticMarkup` from `react-dom/server` and plain string assertions — no jsdom, no testing library. Interaction (pan/zoom, expand) is covered through the pure modules.

---

### Task 1: Graph model

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/lib/royalTree/graph.js`
- Create: `frontend/src/lib/royalTree/graph.test.js`

**Interfaces:**
- Produces: `buildGraph(data) -> Graph` where `data = { people: Person[], families: Family[] }`, `Person = { id, name, kind, sex, generation, house?, reign?, predecessor?, successor?, summary?, portrait?, portraitCredit? }`, `Family = { id, husbandId, wifeId, childIds }` (`husbandId`/`wifeId` may be `null`).
  - `Graph.personById: Map<string, Person>`
  - `Graph.parentIdsOf(id) -> string[]`
  - `Graph.childIdsOf(id) -> string[]` (deduped, stable order across the person's families, each family's `childIds` order preserved)
  - `Graph.spouseIdsOf(id) -> string[]` (unique)
  - `Graph.familyIdsOf(id) -> string[]` (families where `id` is `husbandId` or `wifeId`)
  - `Graph.roots() -> Person[]` (people with no parents, insertion order)
  - `Graph.generations() -> number[]` (sorted unique `person.generation`)
  - `Graph.idsInGeneration(gen) -> string[]` (insertion order)
  - `Graph.childrenOfFamily(familyId) -> string[]`

- [ ] **Step 1: Add vitest**

Edit `frontend/package.json`: add `"test": "vitest run"` to `scripts`, and add `"vitest"` to `devDependencies` (any current version). Then run:

```bash
cd frontend && npm install
```

- [ ] **Step 2: Write the failing test**

Create `frontend/src/lib/royalTree/graph.test.js`:

```js
import { describe, it, expect } from "vitest"
import { buildGraph } from "./graph.js"

const fixture = {
  people: [
    { id: "aethelwulf", name: "Aethelwulf", kind: "monarch", sex: "male", generation: 2 },
    { id: "aethelbald", name: "Aethelbald", kind: "monarch", sex: "male", generation: 3 },
    { id: "alfred", name: "Alfred the Great", kind: "monarch", sex: "male", generation: 3 },
    { id: "emma", name: "Emma of Normandy", kind: "connector", sex: "female", generation: 7 },
    { id: "aethelred2", name: "Aethelred II", kind: "monarch", sex: "male", generation: 7 },
    { id: "edmund2", name: "Edmund II Ironside", kind: "monarch", sex: "male", generation: 8 },
    { id: "edward-confessor", name: "Edward the Confessor", kind: "monarch", sex: "male", generation: 8 }
  ],
  families: [
    { id: "f-aethelwulf", husbandId: "aethelwulf", wifeId: null, childIds: ["aethelbald", "alfred"] },
    { id: "f-aethelred2-first", husbandId: "aethelred2", wifeId: null, childIds: ["edmund2"] },
    { id: "f-aethelred2-emma", husbandId: "aethelred2", wifeId: "emma", childIds: ["edward-confessor"] }
  ]
}

describe("buildGraph", () => {
  it("resolves parents from families", () => {
    expect(buildGraph(fixture).parentIdsOf("alfred")).toEqual(["aethelwulf"])
  })

  it("collects children across all of a person's families, preserving family order", () => {
    expect(buildGraph(fixture).childIdsOf("aethelred2")).toEqual(["edmund2", "edward-confessor"])
  })

  it("reports spouses on both sides", () => {
    const g = buildGraph(fixture)
    expect(g.spouseIdsOf("emma")).toEqual(["aethelred2"])
    expect(g.spouseIdsOf("aethelred2")).toEqual(["emma"])
  })

  it("returns roots, handling multiple roots", () => {
    const g = buildGraph(fixture)
    expect(g.roots().map((p) => p.id).sort()).toEqual(["aethelred2", "aethelwulf", "emma"])
  })

  it("groups people by generation and collapses gaps", () => {
    const g = buildGraph(fixture)
    expect(g.generations()).toEqual([2, 3, 7, 8])
    expect(g.idsInGeneration(3)).toEqual(["aethelbald", "alfred"])
  })

  it("renders a person in two families once", () => {
    const g = buildGraph(fixture)
    expect(g.familyIdsOf("aethelred2")).toEqual(["f-aethelred2-first", "f-aethelred2-emma"])
  })
})
```

- [ ] **Step 3: Run the test and watch it fail**

Run: `cd frontend && npx vitest run src/lib/royalTree/graph.test.js`
Expected: FAIL — cannot resolve `./graph.js`.

- [ ] **Step 4: Implement `graph.js`**

Build the index maps and the lookup functions above. `childIdsOf` walks `familyIdsOf(id)` in order and concatenates each family's `childIds`, dropping duplicates. `parentIdsOf` walks the families a person appears in as a child and returns `husbandId`/`wifeId` where non-null. `sex` is not needed yet but is part of the `Person` shape.

- [ ] **Step 5: Run the test and watch it pass**

Run: `cd frontend && npx vitest run src/lib/royalTree/graph.test.js`
Expected: PASS (6 tests).

- [ ] **Step 6: Seed the data file**

Create `frontend/src/data/royalFamilyTree.json` containing exactly the `fixture` object above (it is real data, and Tasks 5 and 6 render it). This is replaced with the full roster in Task 7.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/royalTree/graph.js frontend/src/lib/royalTree/graph.test.js frontend/src/data/royalFamilyTree.json
git commit -m "Add royal tree graph model"
```

---

### Task 2: Layout — node placement

**Files:**
- Create: `frontend/src/lib/royalTree/layout.js`
- Create: `frontend/src/lib/royalTree/layout.test.js`

**Interfaces:**
- Consumes: `buildGraph` from Task 1.
- Produces:
  - Constants: `NODE_W = 140`, `NODE_H = 44`, `CARD_W = 340`, `CARD_H = 240`, `SPOUSE_GAP = 24`, `SIBLING_GAP = 24`, `ROW_GAP = 72`, `MARGIN = 48`.
  - `orderRow(graph, ids) -> string[]` — the left-to-right order of one generation's people.
  - `placeNodes(graph, { expandedId = null } = {}) -> { nodes, width, height }` where `Node = { id, kind, sex, x, y, w, h, person }`, coordinates are top-left, `w`/`h` are `CARD_W`/`CARD_H` for the expanded node and `NODE_W`/`NODE_H` otherwise.

**Ordering rule (pinned):** sequence people by a depth-first walk from `graph.roots()` (roots in insertion order), visiting each person's children in `childIdsOf` order; a person gets a sequence number at first visit. Within a generation, sort by that sequence number. Then move each spouse next to their partner: the spouse goes on the side where the family's shared children sit (greater mean child sequence than the partner ⇒ right; otherwise left; no children ⇒ right). A person with no sequence number (e.g. a spouse who is never a child) inherits their partner's sequence.

**Placement rule (pinned):**
1. Rows are the non-empty generations in order; `rowHeight = max(node.h in row)`; `y` is cumulative with `ROW_GAP` between rows.
2. Initial `x` is the running left-to-right position in the row with `SPOUSE_GAP` between spouses and `SIBLING_GAP` between everyone else.
3. Run 4 passes: bottom-up, set each node's target `x` to the mean of its children's `x` (nodes with no children keep their `x`); then top-down, set each node's target `x` to the mean of its parents' `x`. After each half-pass, re-space the row by sweeping left to right in the row's **established order** (the order `orderRow` produced — do **not** re-sort by target `x`; a re-sort can interleave a node between two spouses and break the couple adjacency `orderRow` guarantees) assigning `x = max(target, previousX + previousWidth + gap)`.
4. Translate so `min x = MARGIN` and `min y = MARGIN`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/royalTree/layout.test.js` with the same `fixture` as Task 1, plus:

```js
import { describe, it, expect } from "vitest"
import { buildGraph } from "./graph.js"
import { placeNodes, NODE_W, NODE_H, CARD_W, CARD_H } from "./layout.js"

const nodesFor = (data, opts) => {
  const { nodes } = placeNodes(buildGraph(data), opts)
  return new Map(nodes.map((n) => [n.id, n]))
}

describe("placeNodes", () => {
  it("stacks generations top to bottom with no blank band", () => {
    const n = nodesFor(fixture)
    const ys = [...new Set([...n.values()].map((p) => p.y))].sort((a, b) => a - b)
    expect(ys.length).toBe(4) // generations 2,3,7,8 — gaps collapsed
    expect(n.get("aethelwulf").y).toBeLessThan(n.get("alfred").y)
    expect(n.get("aethelred2").y).toBeGreaterThan(n.get("alfred").y)
  })

  it("orders same-generation monarchs left to right by sequence", () => {
    const n = nodesFor(fixture)
    expect(n.get("aethelbald").x).toBeLessThan(n.get("alfred").x)
    expect(n.get("edmund2").x).toBeLessThan(n.get("edward-confessor").x)
  })

  it("places the spouse on the side of the shared children", () => {
    const n = nodesFor(fixture)
    // Edward the Confessor (Emma's son) is the right-hand child, so Emma sits right of Aethelred II.
    expect(n.get("emma").x).toBeGreaterThan(n.get("aethelred2").x)
    expect(n.get("emma").y).toBe(n.get("aethelred2").y)
  })

  it("renders a person in two families as one node", () => {
    const n = nodesFor(fixture)
    expect([...n.keys()].filter((id) => id === "aethelred2")).toHaveLength(1)
  })

  it("grows the expanded node and pushes later rows down", () => {
    const base = nodesFor(fixture)
    const open = nodesFor(fixture, { expandedId: "aethelwulf" })
    expect(open.get("aethelwulf").w).toBe(CARD_W)
    expect(open.get("aethelwulf").h).toBe(CARD_H)
    expect(open.get("alfred").y).toBeGreaterThan(base.get("alfred").y)
    expect(base.get("aethelwulf").w).toBe(NODE_W)
    expect(base.get("aethelwulf").h).toBe(NODE_H)
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `cd frontend && npx vitest run src/lib/royalTree/layout.test.js`
Expected: FAIL — cannot resolve `./layout.js`.

- [ ] **Step 3: Implement `placeNodes` and `orderRow` in `layout.js`**

Follow the ordering rule and placement rule above. Expanded node sizing is applied before the row heights are computed, so the push-down falls out of the algorithm rather than being special-cased.

- [ ] **Step 4: Run the test and watch it pass**

Run: `cd frontend && npx vitest run src/lib/royalTree/layout.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/royalTree/layout.js frontend/src/lib/royalTree/layout.test.js
git commit -m "Add royal tree node placement"
```

---

### Task 3: Layout — edge geometry

**Files:**
- Modify: `frontend/src/lib/royalTree/layout.js`
- Modify: `frontend/src/lib/royalTree/layout.test.js`

**Interfaces:**
- Consumes: `placeNodes` output (Task 2).
- Produces:
  - `buildEdges(graph, nodes) -> Edge[]`, given the `nodes` array from `placeNodes`.
    - `BloodEdge = { id: "blood:" + familyId, kind: "blood", familyId, stemTop: {x, y}, barY, barLeft, barRight, drops: {x, y1, y2}[] }`
    - `MarriageEdge = { id: "marriage:" + familyId, kind: "marriage", familyId, a: {x, y}, b: {x, y}, dot: {x, y} | null }`
  - `edgeToPath(edge) -> string` (SVG `d`).
  - `computeLayout(data, { expandedId = null } = {}) -> { nodes, edges, width, height }` — composes `buildGraph` → `placeNodes` → `buildEdges`.

**Geometry rule (pinned):** one blood edge **per family that has drawn children**. `barY` is midway between the family's parents' row bottom and the children row top. The stem runs from `stemTop` to `(stemTop.x, barY)`; `barLeft`/`barRight` span the leftmost and rightmost child centre-x; each child gets a drop from `(childX, barY)` to `(childX, childTop)`. `stemTop` is the midpoint between the two drawn parents' bottom-centres when both are drawn, else the single drawn parent's bottom-centre. A marriage edge is a horizontal line joining the two spouses' facing edges at the row's vertical centre, with `dot` at its midpoint when the family has children and `null` otherwise.

- [ ] **Step 1: Write the failing tests**

Append to `layout.test.js`:

```js
import { buildEdges, edgeToPath, computeLayout } from "./layout.js"

describe("buildEdges", () => {
  const graph = buildGraph(fixture)
  const { nodes } = placeNodes(graph)
  const edges = buildEdges(graph, nodes)
  const byId = new Map(edges.map((e) => [e.id, e]))
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  it("makes one blood edge per family with drawn children", () => {
    expect(byId.has("blood:f-aethelwulf")).toBe(true)
    expect(byId.has("blood:f-aethelred2-first")).toBe(true)
    expect(byId.has("blood:f-aethelred2-emma")).toBe(true)
    expect(byId.has("blood:f-aethelred2")).toBe(false)
  })

  it("spans the sibling bar across the children's centres", () => {
    const e = byId.get("blood:f-aethelwulf")
    const bal = nodeById.get("aethelbald")
    const alf = nodeById.get("alfred")
    expect(e.barLeft).toBeCloseTo(bal.x + bal.w / 2)
    expect(e.barRight).toBeCloseTo(alf.x + alf.w / 2)
    expect(e.drops).toHaveLength(2)
  })

  it("drops a single-parent family from that parent's centre", () => {
    const e = byId.get("blood:f-aethelred2-first")
    const p = nodeById.get("aethelred2")
    expect(e.stemTop.x).toBeCloseTo(p.x + p.w / 2)
    expect(e.drops[0].x).toBeCloseTo(nodeById.get("edmund2").x + nodeById.get("edmund2").w / 2)
  })

  it("stems a couple's children from between the spouses and dots the marriage", () => {
    const e = byId.get("blood:f-aethelred2-emma")
    const m = byId.get("marriage:f-aethelred2-emma")
    const a = nodeById.get("aethelred2")
    const b = nodeById.get("emma")
    expect(e.stemTop.x).toBeCloseTo((a.x + a.w / 2 + b.x + b.w / 2) / 2)
    expect(m.dot).not.toBeNull()
    expect(m.a.x).toBeCloseTo(a.x + a.w)
    expect(m.b.x).toBeCloseTo(b.x)
  })

  it("renders geometry to an SVG path", () => {
    expect(edgeToPath(byId.get("blood:f-aethelwulf"))).toMatch(/^M[\d.]+ [\d.]+/)
    expect(edgeToPath(byId.get("marriage:f-aethelred2-emma"))).toMatch(/^M[\d.]+ [\d.]+ H[\d.]+/)
  })
})

describe("computeLayout", () => {
  it("composes graph, placement and edges", () => {
    const layout = computeLayout(fixture, { expandedId: "emma" })
    expect(layout.nodes.some((n) => n.id === "emma" && n.w === 340)).toBe(true)
    expect(layout.edges.length).toBeGreaterThan(0)
    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `cd frontend && npx vitest run src/lib/royalTree/layout.test.js`
Expected: FAIL — `buildEdges` is not exported.

- [ ] **Step 3: Implement `buildEdges`, `edgeToPath`, `computeLayout`**

Follow the geometry rule. `edgeToPath` renders a blood edge as `M stemTop.x stemTop.y V barY M barLeft barY H barRight` then one `M x barY V y2` per drop; a marriage edge as `M a.x a.y H b.x` (plus `M dot.x dot.y...` only if a dot is drawn — the dot itself is rendered as a `<circle>` by the component, so it is not in the path).

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd frontend && npx vitest run src/lib/royalTree/layout.test.js`
Expected: PASS (all layout tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/royalTree/layout.js frontend/src/lib/royalTree/layout.test.js
git commit -m "Add royal tree edge geometry"
```

---

### Task 4: Pan and zoom maths

**Files:**
- Create: `frontend/src/lib/royalTree/panZoom.js`
- Create: `frontend/src/lib/royalTree/panZoom.test.js`

**Interfaces:**
- Produces: `View = { x, y, k }` where a world point `(wx, wy)` maps to screen `(wx * k + x, wy * k + y)`.
  - `identityView() -> View`
  - `clampScale(k, min = 0.25, max = 2.5) -> number`
  - `panBy(view, dx, dy) -> View`
  - `zoomAt(view, anchor, factor, limits = {}) -> View` — scales by `factor`, clamped, keeping the world point under `anchor` fixed.
  - `fitView(content, viewport, padding = 48) -> View` — `content`/`viewport` are `{ width, height }`; centre and scale to fit, scale capped at 2.5.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/royalTree/panZoom.test.js`:

```js
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
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `cd frontend && npx vitest run src/lib/royalTree/panZoom.test.js`
Expected: FAIL — cannot resolve `./panZoom.js`.

- [ ] **Step 3: Implement `panZoom.js`**

`zoomAt`: `k2 = clampScale(view.k * factor)`; `x2 = anchor.x - (anchor.x - view.x) * (k2 / view.k)`; same for `y`. `fitView`: `k = clampScale(min((vw - 2p)/cw, (vh - 2p)/ch))`, then centre.

- [ ] **Step 4: Run the test and watch it pass**

Run: `cd frontend && npx vitest run src/lib/royalTree/panZoom.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/royalTree/panZoom.js frontend/src/lib/royalTree/panZoom.test.js
git commit -m "Add royal tree pan and zoom maths"
```

---

### Task 5: Tree rendering components

**Files:**
- Create: `frontend/src/pages/royalTree/FactCard.jsx`
- Create: `frontend/src/pages/royalTree/TreeNode.jsx`
- Create: `frontend/src/pages/royalTree/TreeCanvas.jsx`
- Create: `frontend/src/pages/royalTree/FactCard.test.jsx`
- Create: `frontend/src/pages/royalTree/TreeNode.test.jsx`
- Create: `frontend/src/pages/royalTree/TreeCanvas.test.jsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `computeLayout` (Task 3), the pan/zoom functions (Task 4), and `data` from Task 1.
- Produces:
  - `FactCard({ person, onClose })` — portrait (or monogram fallback), name, house, reign, predecessor, successor, summary.
  - `TreeNode({ node, expanded, onSelect })` — a chip for `node.kind === "monarch"` (clickable) and a dimmer chip for `"connector"` (inert); renders `<FactCard>` inside itself when `expanded`.
  - `TreeCanvas({ data, expandedId, onSelect })` — viewport with pan (pointer drag), zoom (wheel), fit/reset controls, the transformed layer containing the edge `<svg>` and the nodes.

**Rendering approach (pinned):** the canvas is an HTML `div` with `overflow: hidden`; inside it a single layer `div` is transformed with `transform: translate(${view.x}px, ${view.y}px) scale(${view.k})`. Edge `<path>`s live in an absolutely-positioned `<svg>` sized to `layout.width` × `layout.height` at the layer origin. Nodes are absolutely-positioned HTML `div`s (so the card can be normal HTML), placed with `left`/`top`/`width`/`height` from the layout.

- [ ] **Step 1: Write the failing tests**

`FactCard.test.jsx`:

```jsx
import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import FactCard from "./FactCard.jsx"

const person = {
  id: "william1", name: "William I", kind: "monarch", sex: "male", generation: 9,
  house: "House of Normandy", reign: "1066-1087",
  predecessor: "Harold II", successor: "William II",
  summary: "The Conqueror."
}

describe("FactCard", () => {
  it("shows the name, house, reign, predecessor and successor", () => {
    const html = renderToStaticMarkup(<FactCard person={person} onClose={() => {}} />)
    expect(html).toContain("William I")
    expect(html).toContain("House of Normandy")
    expect(html).toContain("1066-1087")
    expect(html).toContain("Harold II")
    expect(html).toContain("William II")
    expect(html).toContain("The Conqueror.")
  })

  it("uses a monogram when there is no portrait", () => {
    const html = renderToStaticMarkup(<FactCard person={person} onClose={() => {}} />)
    expect(html).not.toContain("<img")
    expect(html).toContain("royal-tree-monogram")
  })

  it("shows a dash when predecessor or successor is missing", () => {
    const root = { ...person, id: "ealhmund", predecessor: undefined, successor: undefined }
    const html = renderToStaticMarkup(<FactCard person={root} onClose={() => {}} />)
    expect(html).toContain("Predecessor")
    expect(html).toContain("–")
  })

  it("renders a portrait image when one is set", () => {
    const withPortrait = { ...person, portrait: "william1.jpg" }
    const html = renderToStaticMarkup(<FactCard person={withPortrait} onClose={() => {}} />)
    expect(html).toContain('src="/portraits/william1.jpg"')
    expect(html).not.toContain("royal-tree-monogram")
  })
})
```

`TreeNode.test.jsx`:

```jsx
import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import TreeNode from "./TreeNode.jsx"

const monarchNode = { id: "alfred", kind: "monarch", sex: "male", x: 0, y: 0, w: 140, h: 44, person: { id: "alfred", name: "Alfred the Great", kind: "monarch" } }
const connectorNode = { id: "emma", kind: "connector", sex: "female", x: 0, y: 0, w: 140, h: 44, person: { id: "emma", name: "Emma of Normandy", kind: "connector" } }

describe("TreeNode", () => {
  it("renders a clickable monarch chip", () => {
    const html = renderToStaticMarkup(<TreeNode node={monarchNode} expanded={false} onSelect={() => {}} />)
    expect(html).toContain("Alfred the Great")
    expect(html).toContain("<button")
  })

  it("renders an inert connector chip", () => {
    const html = renderToStaticMarkup(<TreeNode node={connectorNode} expanded={false} onSelect={() => {}} />)
    expect(html).toContain("Emma of Normandy")
    expect(html).not.toContain("<button")
  })

  it("renders the fact card in place when expanded", () => {
    const html = renderToStaticMarkup(<TreeNode node={monarchNode} expanded onSelect={() => {}} />)
    expect(html).toContain("royal-tree-card")
  })
})
```

`TreeCanvas.test.jsx`:

```jsx
import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import TreeCanvas from "./TreeCanvas.jsx"
import data from "../../data/royalFamilyTree.json"

describe("TreeCanvas", () => {
  it("renders a chip for every person and an edge path per family", () => {
    const html = renderToStaticMarkup(<TreeCanvas data={data} expandedId={null} onSelect={() => {}} />)
    expect(html).toContain("Aethelwulf")
    expect(html).toContain("Emma of Normandy")
    expect(html).toContain("<path")
  })

  it("renders the expanded node's card", () => {
    const html = renderToStaticMarkup(<TreeCanvas data={data} expandedId="alfred" onSelect={() => {}} />)
    expect(html).toContain("royal-tree-card")
  })

  it("renders zoom controls", () => {
    const html = renderToStaticMarkup(<TreeCanvas data={data} expandedId={null} onSelect={() => {}} />)
    expect(html).toContain("royal-tree-controls")
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `cd frontend && npx vitest run src/pages/royalTree`
Expected: FAIL — components do not exist.

- [ ] **Step 3: Implement `FactCard`, `TreeNode`, `TreeCanvas`**

`FactCard`: render `person.portrait` as `<img src={"/portraits/" + person.portrait}>` when set, else a `<span className="royal-tree-monogram">` with the person's initials. Predecessor/successor render as `person.predecessor || "–"`. Include the `royal-tree-card`, `royal-tree-monogram` class names the tests expect.

`TreeNode`: monarch nodes render a `<button type="button" onClick={() => onSelect(node.id)}>`; connector nodes render a `<div>`. When `expanded`, render `<FactCard person={node.person} onClose={() => onSelect(null)} />` inside the node's box.

`TreeCanvas`: `useMemo` the layout from `data` and `expandedId`; hold `view` in state, initialised with `useState(() => identityView())` and a `useEffect` that fits the view once when the layout's width/height first become non-zero; wire `onWheel` (zoom, `preventDefault`) and pointer drag (pan) to the maths from Task 4; render the controls (`royal-tree-controls`) with zoom in/out and reset buttons.

- [ ] **Step 4: Add styles**

Append `.royal-tree-*` rules to `frontend/src/index.css` using the existing CSS variables (`--card`, `--line`, `--text`, `--muted`, `--primary`). The viewport is `height: min(70vh, 720px)`, `border: 1px solid var(--line)`, `border-radius`, `overflow: hidden`, `touch-action: none`, `cursor: grab`. Monarch chips use `--primary`; connector chips use a muted outline. The card is `var(--card)` with `box-shadow`.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `cd frontend && npx vitest run src/pages/royalTree`
Expected: PASS (all component tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/royalTree frontend/src/index.css
git commit -m "Add royal tree canvas and fact card"
```

---

### Task 6: Page, route and navigation

**Files:**
- Create: `frontend/src/pages/royalTree/RoyalTreePage.jsx`
- Create: `frontend/src/pages/royalTree/RoyalTreePage.test.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Navbar.jsx`
- Modify: `frontend/src/pages/LandingPage.jsx`

**Interfaces:**
- Consumes: `TreeCanvas` (Task 5).
- Produces: `RoyalTreePage()` — default export; header (`h1` "Royal Family Tree", the spec's one-line description) plus `<TreeCanvas>`; owns `expandedId` state.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/royalTree/RoyalTreePage.test.jsx`:

```jsx
import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import RoyalTreePage from "./RoyalTreePage.jsx"

describe("RoyalTreePage", () => {
  it("renders the heading and the tree", () => {
    const html = renderToStaticMarkup(<RoyalTreePage />)
    expect(html).toContain("Royal Family Tree")
    expect(html).toContain("royal-tree-canvas")
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `cd frontend && npx vitest run src/pages/royalTree/RoyalTreePage.test.jsx`
Expected: FAIL — the page does not exist.

- [ ] **Step 3: Implement the page**

`RoyalTreePage` holds `const [expandedId, setExpandedId] = useState(null)` and renders `<TreeCanvas data={royalFamilyTree} expandedId={expandedId} onSelect={setExpandedId} />`.

- [ ] **Step 4: Wire the route, navbar link and landing tool card**

`App.jsx`: import `RoyalTreePage` and add `<Route path="/family-tree" element={<RoyalTreePage />} />` before the catch-all.
`Navbar.jsx`: add `<Link to="/family-tree">Family Tree</Link>` inside `site-nav`.
`LandingPage.jsx`: add a second `tool-card` linking to `/family-tree`, titled "Royal Family Tree", describing the Ealhmund-to-Charles III zoomable pedigree.

- [ ] **Step 5: Run the test and the whole suite**

Run: `cd frontend && npx vitest run`
Expected: PASS (every test in the project).

- [ ] **Step 6: Build and eyeball**

Run: `cd frontend && npm run build`
Expected: build succeeds with no unresolved imports. Then run `npm run dev`, open `/family-tree`, and confirm the slice renders, pans, zooms, and expands.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/royalTree/RoyalTreePage.jsx frontend/src/pages/royalTree/RoyalTreePage.test.jsx frontend/src/App.jsx frontend/src/components/Navbar.jsx frontend/src/pages/LandingPage.jsx
git commit -m "Add royal family tree page and navigation"
```

---

### Task 7: The full dataset

**Files:**
- Modify: `frontend/src/data/royalFamilyTree.json`
- Create: `frontend/src/lib/royalTree/validate.js`
- Create: `frontend/src/lib/royalTree/validate.test.js`

**Interfaces:**
- Produces: `validateTree(data) -> string[]` — a list of human-readable problems; empty means valid. Checks: ids are unique; every `husbandId`/`wifeId`/`childId` resolves to a person; every person has an integer `generation`; every `kind: "monarch"` has non-empty `name`, `house`, `reign` and `summary`; no person is both absent from every family and has parents (orphan check is informational only).
- Produces: `MONARCH_IDS` — the sorted list of the 59 monarch ids the dataset must contain.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/royalTree/validate.test.js`:

```js
import { describe, it, expect } from "vitest"
import { validateTree, MONARCH_IDS } from "./validate.js"
import data from "../../data/royalFamilyTree.json"

describe("validateTree", () => {
  it("accepts a well-formed tree", () => {
    expect(validateTree({ people: [], families: [] })).toEqual([])
  })

  it("reports dangling references", () => {
    const bad = {
      people: [{ id: "a", name: "A", kind: "monarch", sex: "male", generation: 0, house: "H", reign: "1-2", summary: "s" }],
      families: [{ id: "f", husbandId: "a", wifeId: "missing", childIds: [] }]
    }
    expect(validateTree(bad).join(" ")).toContain("missing")
  })

  it("reports a missing generation", () => {
    const bad = { people: [{ id: "a", name: "A", kind: "monarch", sex: "male", house: "H", reign: "1-2", summary: "s" }], families: [] }
    expect(validateTree(bad).join(" ")).toContain("generation")
  })

  it("validates the shipped dataset", () => {
    expect(validateTree(data)).toEqual([])
  })

  it("ships exactly the full roster of monarchs", () => {
    const monarchs = data.people.filter((p) => p.kind === "monarch").map((p) => p.id).sort()
    expect(monarchs).toEqual(MONARCH_IDS)
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `cd frontend && npx vitest run src/lib/royalTree/validate.test.js`
Expected: FAIL — `./validate.js` does not exist.

- [ ] **Step 3: Implement `validate.js`**

Export `MONARCH_IDS` (the 59 ids from the spec's roster, sorted) and the `validateTree` function described above.

- [ ] **Step 4: Research and write the full dataset**

Replace `frontend/src/data/royalFamilyTree.json` with every person from the spec's two rosters. For each person record: `id` (kebab-case of the name), `name`, `kind` (`monarch` or `connector`), `sex`, `generation` (0 = Ealhmund's row, incrementing per generation down the line; people who are contemporaries share a generation — this is the one authored number in the layout), and for monarchs `house`, `reign`, `predecessor`, `successor` (real throne sequence, per the spec) and a one-paragraph `summary`. Encode the families so that blood lines are `childIds` and marriages are `husbandId`/`wifeId`.

Worked examples to match exactly: `f-aethelred2-first` (`husbandId: "aethelred2"`, `wifeId: null`, `childIds: ["edmund2"]`) and `f-aethelred2-emma` (`wifeId: "emma"`, `childIds: ["edward-confessor"]`) — only Edward hangs off the marriage. Mary I, Elizabeth I and Edward VI hang off Henry VIII with no wives drawn. Emma, Adela of Blois, Sophia of Hanover and the other line-carrying connectors are drawn; the rest are not.

- [ ] **Step 5: Run the test and watch it pass**

Run: `cd frontend && npx vitest run src/lib/royalTree/validate.test.js src/lib/royalTree/layout.test.js`
Expected: PASS. Then run `cd frontend && npx vitest run` — the whole suite still passes.

- [ ] **Step 6: Look at the real chart**

Run: `cd frontend && npm run dev`, open `/family-tree`, and check the whole line reads sensibly top to bottom, with no overlapping nodes and no stray long edges. If the authored generation numbers put a chain in the wrong band, fix those numbers and reload.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/data/royalFamilyTree.json frontend/src/lib/royalTree/validate.js frontend/src/lib/royalTree/validate.test.js
git commit -m "Add the full royal family tree dataset"
```

---

### Task 8: Portraits

**Files:**
- Create: `frontend/public/portraits/<person-id>.jpg` (one per monarch)
- Modify: `frontend/src/data/royalFamilyTree.json` (add `portrait` and `portraitCredit`)
- Modify: `frontend/src/pages/royalTree/FactCard.test.jsx`

**Interfaces:**
- Consumes: `FactCard` (Task 5), which already renders `person.portrait` as `/portraits/<file>` with a monogram fallback.

- [ ] **Step 1: Write the failing test**

Append to `FactCard.test.jsx`:

```jsx
it("falls back to a monogram when the portrait file is absent from the data", () => {
  const { portrait, ...noPortrait } = person
  const html = renderToStaticMarkup(<FactCard person={noPortrait} onClose={() => {}} />)
  expect(html).toContain("royal-tree-monogram")
})
```

- [ ] **Step 2: Run it and watch it pass**

Run: `cd frontend && npx vitest run src/pages/royalTree/FactCard.test.jsx`
Expected: PASS (the fallback already exists; this pins it).

- [ ] **Step 3: Source the portraits**

For each monarch, find a public-domain portrait on Wikimedia Commons (prefer a contemporary or near-contemporary painting). Download it, downscale to about 240 px wide, and save it as `frontend/public/portraits/<person-id>.jpg`. Add `"portrait": "<person-id>.jpg"` and `"portraitCredit": "Wikimedia Commons, public domain"` to each monarch record. Monarchs with no suitable image keep no `portrait` field and fall back to the monogram.

- [ ] **Step 4: Verify the whole suite and the page**

Run: `cd frontend && npx vitest run`
Expected: PASS. Then run `npm run build` and open `/family-tree`; click through several monarchs and confirm each portrait loads (and that a portrait-less monarch shows a monogram, not a broken image).

- [ ] **Step 5: Commit**

```bash
git add frontend/public/portraits frontend/src/data/royalFamilyTree.json frontend/src/pages/royalTree/FactCard.test.jsx
git commit -m "Add monarch portraits"
```

---

## Self-Review

- **Spec coverage:** intent/scope → the roster in Tasks 7 and 8; orthogonal pedigree style → Task 2 placement + Task 3 bars; node-expands-in-place → Tasks 2 and 5; real throne predecessor/successor → Task 7; computed layout → Tasks 2 and 3; marriage convention and the Aethelred II split → Tasks 1 and 7; no highlighting → Global Constraints; static data, no backend → Tasks 1 and 6; portraits from Wikimedia → Task 8; extensibility (adding Cnut = data only) → the schema in Task 1 plus the authored `generation` in Task 7.
- **Deviation from the spec, deliberate:** the spec said generation is "longest path from the root." That breaks on this graph — the Norman ducal chain is graph-shallow but chronologically late, so longest-path would put William I above Edward the Confessor. The plan authors a `generation` number per person instead; the spec's "computed, not hand-placed" intent is preserved because positions, ordering and routing are still computed. This is worth flagging to the owner.
- **Type consistency:** `buildGraph` (Task 1) is consumed by `placeNodes`/`buildEdges` (Tasks 2–3); `placeNodes`'s `Node` shape is what `buildEdges` and `TreeNode` read; `computeLayout`'s `{ nodes, edges, width, height }` is what `TreeCanvas` consumes; `View` from Task 4 is what `TreeCanvas` stores; `person.portrait` is written in Task 8 and read in Task 5.
- **Review Focus coverage:** all five lines have a test named in the task that owns the code (Tasks 8, 1/3, 1/2, 2, 5).
