# Royal Family Tree Tweaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add monarch epithets and life dates, make the tree viewport-filling beneath the navbar, and highlight dynastic houses with tinted regions.

**Architecture:** Keep the existing JSON-driven React tree and generation layout. Add a pure house-region calculation helper and render its output behind the current edges and nodes in the transformed canvas layer.

**Tech Stack:** React 18, JavaScript, CSS, Vitest, Vite.

**Spec:** Approved design in planning conversation, 2026-10-27.

## Global Constraints

- Keep the shared navbar visible.
- Preserve all 59 monarchs, connector nodes, relationships, and layout behaviour.
- Use accepted approximate dates and `unknown`; never invent precision.
- No backend changes or new dependencies.
- Other routes must retain their existing layout.
- No git commits or other mutations without explicit user approval.

## Review Focus

- Incomplete early-monarch dates must still produce useful fact cards.
- Existing epithets such as Alfred the Great must not be duplicated.
- Expanded cards must remain inside their house regions.
- Overlapping houses must retain readable boundaries and labels.
- The viewport-filling layout must not affect other routes.

---

### Task 1: Monarch epithets and life-date data

**Files:**
- Modify: `frontend/src/data/royalFamilyTree.json`
- Modify: `frontend/src/lib/royalTree/validate.js`
- Test: `frontend/src/lib/royalTree/validate.test.js`

**Interfaces:**
- Adds required monarch string field: `lifeDates`
- Continues using `name` for the complete displayed monarch name.

- [x] **Step 1: Write failing data tests**

Add tests proving:
- A monarch with missing or blank `lifeDates` produces a validation problem containing `lifeDates`.
- Every shipped monarch has a non-empty `lifeDates`.
- William I is named `William I the Conqueror`.
- Richard I is named `Richard I the Lionheart`.
- Alfred remains `Alfred the Great`, without a duplicated epithet.

Update existing valid monarch fixtures with a representative `lifeDates` value so unrelated validation tests remain focused.

- [x] **Step 2: Verify the tests fail**

Run:
```bash
cd frontend && npm test -- src/lib/royalTree/validate.test.js
```

Expected: failures for missing `lifeDates` validation and the two new epithets.

- [x] **Step 3: Update validation and monarch data**

Add `lifeDates` to the required monarch fields in `validateTree`.

Research and populate `lifeDates` for every monarch:
- Standard form: `1028-1087`
- Approximate form: `c. 848-899`
- Living monarchs: `1948-present`
- Insufficient record: `unknown` or a partially approximate value where accepted

Add these established epithets, leaving other names unchanged:
- Edgar the Peaceful
- William I the Conqueror
- William II Rufus
- Henry I Beauclerc
- Henry II Curtmantle
- Richard I the Lionheart
- John Lackland
- Edward I Longshanks
- Henry IV Bolingbroke
- Elizabeth I the Virgin Queen
- Charles II the Merry Monarch
- William IV the Sailor King
- Edward VII the Peacemaker

- [x] **Step 4: Verify the data tests pass**

Run:
```bash
cd frontend && npm test -- src/lib/royalTree/validate.test.js
```

Expected: all validation and shipped-dataset tests pass.

---

### Task 2: Life and reign fields on fact cards

**Files:**
- Modify: `frontend/src/pages/royalTree/FactCard.jsx`
- Modify: `frontend/src/index.css`
- Test: `frontend/src/pages/royalTree/FactCard.test.jsx`

**Interfaces:**
- Consumes: `person.lifeDates` and existing `person.reign`
- Produces a four-item fact grid: Life, Reign, Predecessor, Successor.

- [x] **Step 1: Write the failing rendering test**

Add `lifeDates: "1028-1087"` to the William I fixture. Assert that the card contains:
- `<dt>Life</dt>` and `1028-1087`
- `<dt>Reign</dt>` and `1066-1087`
- Existing predecessor and successor values

Add a case with `lifeDates: "unknown"` and assert that it renders literally.

- [x] **Step 2: Verify the test fails**

Run:
```bash
cd frontend && npm test -- src/pages/royalTree/FactCard.test.jsx
```

Expected: failure because the Life field is absent.

- [x] **Step 3: Implement the fact-card layout**

Move reign out of the unlabelled header and add Life and Reign entries before Predecessor and Successor in `.royal-tree-facts`. Retain the two-column grid and automatic card-height measurement. Remove the now-unused reign-specific header styling.

- [x] **Step 4: Verify the card tests pass**

Run:
```bash
cd frontend && npm test -- src/pages/royalTree/FactCard.test.jsx
```

Expected: all FactCard tests pass.

---

### Task 3: Viewport-filling family-tree route

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/index.css`
- Create: `frontend/src/App.test.jsx`

**Interfaces:**
- Adds route-specific main class: `app-main-family-tree`
- Leaves the default `app-main` class unchanged on other routes.

- [x] **Step 1: Write failing route-layout tests**

Render `App` inside `MemoryRouter` and `AuthProvider` using `renderToStaticMarkup`.

Assert:
- `/family-tree` produces `class="app-main app-main-family-tree"`.
- `/` produces the normal `app-main` without the modifier.
- The family-tree page still renders its heading and canvas.

- [x] **Step 2: Verify the modifier test fails**

Run:
```bash
cd frontend && npm test -- src/App.test.jsx
```

Expected: failure because `app-main-family-tree` is not yet emitted.

- [x] **Step 3: Implement route-aware sizing**

Use `useLocation()` in `App` to apply the modifier only when `pathname === "/family-tree"`.

In CSS:
- Remove the width cap and margins for the modifier.
- Make it a flex column with `min-height: 0` and hidden overflow.
- Let `.royal-tree-page` fill the main area with rows for a compact header and `minmax(0, 1fr)` canvas.
- Remove the canvas’s fixed `70vh`/720px height constraint on this route.
- Keep the navbar in normal flow and preserve existing styles for every other route.

- [x] **Step 4: Verify route tests pass**

Run:
```bash
cd frontend && npm test -- src/App.test.jsx src/pages/royalTree/RoyalTreePage.test.jsx
```

Expected: all tests pass.

---

### Task 4: Tinted house regions

**Files:**
- Create: `frontend/src/lib/royalTree/houses.js`
- Create: `frontend/src/lib/royalTree/houses.test.js`
- Modify: `frontend/src/pages/royalTree/TreeCanvas.jsx`
- Modify: `frontend/src/index.css`
- Test: `frontend/src/pages/royalTree/TreeCanvas.test.jsx`

**Interfaces:**
```js
buildHouseRegions(nodes, padding = 20)
```

Returns one entry per represented monarch house:
```js
{ house, color, x, y, width, height }
```

- [x] **Step 1: Write failing region-calculation tests**

Cover:
- Connector nodes are ignored.
- One region is returned per house.
- Bounds include every monarch node plus exactly 20px padding.
- An expanded node’s larger width and height are included.
- The shipped layout produces 12 houses with 12 distinct colours.
- Every current house has a non-empty colour.

- [x] **Step 2: Verify the helper tests fail**

Run:
```bash
cd frontend && npm test -- src/lib/royalTree/houses.test.js
```

Expected: failure because `houses.js` does not exist.

- [x] **Step 3: Implement `buildHouseRegions`**

Group monarch nodes by `person.house`, calculate each group’s padded axis-aligned bounds, and assign a curated colour for each current house. Preserve deterministic output and do not alter node positions.

- [x] **Step 4: Verify helper tests pass**

Run:
```bash
cd frontend && npm test -- src/lib/royalTree/houses.test.js
```

Expected: all house-region tests pass.

- [x] **Step 5: Write failing canvas-rendering tests**

Assert that the shipped tree renders:
- `.royal-tree-house-regions`
- `.royal-tree-house-region`
- Visible labels including `House of Wessex` and `House of Windsor`

- [x] **Step 6: Verify canvas tests fail**

Run:
```bash
cd frontend && npm test -- src/pages/royalTree/TreeCanvas.test.jsx
```

Expected: failure because no house regions are rendered.

- [x] **Step 7: Render and style the regions**

Derive regions from `display.nodes`, so they follow tweening and expanded-card dimensions. Render them before the edge SVG and nodes inside `.royal-tree-layer`.

Use absolute positioning, non-intercepting pointer events, low-opacity backgrounds, visible borders, and high-contrast labels. Regions must share the existing pan/zoom transform without any separate coordinate handling.

- [x] **Step 8: Verify all royal-tree tests pass**

Run:
```bash
cd frontend && npm test -- src/lib/royalTree src/pages/royalTree src/App.test.jsx
```

Expected: all tests pass.

---

### Task 5: Full verification

- [x] Run `cd frontend && npm test`; expect the complete suite to pass.
- [x] Run `cd frontend && npm run lint`; expect no errors.
- [x] Run `cd frontend && npm run build`; expect a successful production build.
- [x] Open `/family-tree` in a desktop browser and verify:
  - Navbar remains visible.
  - Canvas fills the remaining viewport without a boxed height cap.
  - Other routes retain their original widths and margins.
  - Epithets and Life/Reign fields appear correctly.
  - House regions and labels follow pan, zoom, reset, and card expansion.
  - Overlapping regions remain legible.
