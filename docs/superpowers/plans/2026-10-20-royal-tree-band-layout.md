# Royal Tree Band Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate misleading line crossings/fusions and pointless bends by laying the tree out from family structure (nested column bands) instead of iterative averaging.

**Architecture:** Replace `orderRow` and the four median-relaxation passes with a recursive band layout: married people form *clusters*; each cluster owns a contiguous x-band in every row below it; child clusters tile inside it in succession order; parents (or the couple midpoint) centre over their children. Sibling bars and stems can then never leave their band, so two families' lines cannot touch, and centring/straightness fall out of construction.

**Tech Stack:** Vanilla JS modules under `frontend/src/lib/royalTree/`, vitest, existing SVG edge rendering in `TreeCanvas.jsx` (untouched).

**Spec:** No separate design doc. The design was agreed in session and is captured by this plan and the before/after mockups; ordering rule: succession order left-to-right, overruled only where needed for clear flow.

## Global Constraints

- No code comments unless explicitly required (AGENTS.md).
- `computeLayout(data, {expandedId, expandedHeight})` keeps its exact signature and return shape `{nodes, edges, width, height}` — `TreeCanvas.jsx`, `tween.js`, `panZoom.js` stay untouched.
- No changes to `royalFamilyTree.json`, chip/line CSS, or generation→row mapping.
- Tests run with `cd frontend && npx vitest run`; commit per task.

## File Structure

- Modify `frontend/src/lib/royalTree/layout.js` — band placement + edge lanes replace ordering/relaxation.
- Create `frontend/src/lib/royalTree/clusters.js` — cluster building, succession ordering, root ordering.
- Modify `frontend/src/lib/royalTree/layout.test.js` — invariant tests, updated ordering tests, case regressions.

## Review Focus

1. Expanded card (`CARD_W`) inside a narrow band must recompute bands so bars stay aligned — pinned in Task 4.
2. One person parent of several families (Henry VIII, John of Gaunt, Aethelred II): nested same-cluster bars are correct and must keep per-family stems — pinned in Task 3.
3. Childless couples (William III + Mary II) reserve only their chip widths — pinned in Task 2.
4. Married-in spouse stays adjacent to partner on the correct side (Emma of Normandy right of Aethelred II) — pinned in Task 2.
5. Non-contiguous generations (fixture gens 2,3,7,8) still collapse to consecutive rows with gutters per row pair — pinned by existing row test in Task 2.

---

### Task 1: Pin the defects with failing invariant tests

**Files:** Modify `frontend/src/lib/royalTree/layout.test.js`

- [ ] **Step 1: Add four tests against the shipped dataset**
  - `keeps unrelated families' sibling bars apart in a shared gutter`: for every pair of blood edges with equal `barY` whose families share no parent, assert ranges are disjoint (`e1.barRight < e2.barLeft` or vice versa).
  - `no drop passes through another family's bar`: for every drop `(x, y1, y2)` and every other blood edge `o` with disjoint parents, assert NOT (`o.barY` strictly between `y1` and `y2` AND `o.barLeft <= x <= o.barRight`).
  - `centres a parent over a single child`: for every one-child family, parent centre x === child centre x.
  - `centres parents over their children's span`: for every multi-child family, parent (or couple midpoint) centre === mean of outer children centres within 1px.
- [ ] **Step 2: Run** `cd frontend && npx vitest run src/lib/royalTree/layout.test.js` — expect the bar-apart and centring tests to FAIL (Adela/Henry fusion, Aethelwulf bend), drop-through to pass.
- [ ] **Step 3: Commit** `git commit -m "test: pin royal tree crossing and centring invariants"`

### Task 2: Clusters and band placement

**Files:** Create `frontend/src/lib/royalTree/clusters.js`; Modify `frontend/src/lib/royalTree/layout.js`; Modify tests.

**Interfaces:**
- `buildClusters(graph)` → `{ clusterById, clusterIdOfPerson, rootClusterIds }`. A cluster is `{ id, memberIds, familyIds, childIds, birthClusterId }`: members are people joined by in-tree marriages; `memberIds` ordered primary-first (walk-keeper preference via `keepsWalk`, then people order); `childIds` = concatenation of family `childIds` in family data order (succession order); `birthClusterId` = the cluster of the primary member's parents, or null.
- `placeNodes(graph, opts)` keeps its signature; internally: post-order recursion `placeCluster(clusterId, x0)` — home child clusters (`birthClusterId === cluster.id`) tiled left-to-right with `SIBLING_GAP`, member chips (`widthOf`, `SPOUSE_GAP`) centred over the children span (at `x0` when childless), returns band width = max(chips span, children span). Rows/y exactly as today. Delete `orderRow`, `sequenceNumbers`, the `respaced` passes; drop the `orderRow` export.

- [ ] **Step 1: Update ordering tests** — replace the `orderRow` describe with placeNodes assertions: consortFixture row order `[rival, queen, consort]` / `[cousin, heir]`; married-in adjacency; Emma right of Aethelred II; childless couple width.
- [ ] **Step 2: Run tests** — expect FAIL (functions missing / old behaviour).
- [ ] **Step 3: Implement** `clusters.js` and rewire `placeNodes` per the interfaces above.
- [ ] **Step 4: Run** `npx vitest run src/lib/royalTree/layout.test.js` — Task 1 centring tests now pass; bar-apart passes for all gutters except any cross-cluster reach.
- [ ] **Step 5: Commit** `git commit -m "feat: lay royal tree out in nested family bands"`

### Task 3: Edge lanes for bars that must cross bands

**Files:** Modify `buildEdges` in `frontend/src/lib/royalTree/layout.js`; add test.

- [ ] **Step 1: Add failing test** `routes cross-band bars in their own lane`: fixture with a cross-cluster couple whose birth bands cannot be adjacent; assert the two disjoint-parent blood edges in that gutter get different `barY`, and no drop of one crosses the other's bar.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement**: per gutter, greedily assign lanes (new `LANE_GAP` const) so edges sharing a lane have disjoint x-ranges or share a parent; `barY` is offset per lane within the gutter; `edgeToPath` is unchanged because each bar always contains its own stem x and drop xs.
- [ ] **Step 4: Run** all layout tests — existing `buildEdges` tests (marriage dot, single-parent stem, childless couple) still pass.
- [ ] **Step 5: Commit** `git commit -m "feat: lane-route royal tree bars that must cross bands"`

### Task 4: Regressions for the reported cases

**Files:** Modify `frontend/src/lib/royalTree/layout.test.js`

- [ ] **Step 1: Add tests**
  - Bar-disjointness asserted per gutter for the reported spots: `henry1` vs `adela`; `john-beaufort-duke` vs `richard-york`; `henry8`'s families vs `margaret-tudor`'s; `charles1` vs `elizabeth-stuart`; `james2` vs `sophia`.
  - Succession order preserved: siblings' x-order equals data `childIds` order for every family whose children share a row band.
  - Expanded-card invariant: `computeLayout(data, {expandedId: "henry1"})` still satisfies bar-disjointness and centring.
- [ ] **Step 2: Run** full suite `cd frontend && npx vitest run` and `npm run build` — all green.
- [ ] **Step 3: Commit** `git commit -m "test: regress royal tree crossing cases"`

### Task 5: Visual verification

- [ ] **Step 1:** Run the app (`./gradlew run` or `cd frontend && npm run dev`), open `/family-tree`, and screenshot the Aethelwulf section and the five reported sections.
- [ ] **Step 2:** Compare against the mockups: straight single-child drops, centred parents, no fused bars; fix any discrepancy with a test first.
- [ ] **Step 3: Commit** if anything changed.
