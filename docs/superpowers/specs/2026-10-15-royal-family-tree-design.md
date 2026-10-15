# Royal Family Tree — Design

- **Date:** 2026-10-15
- **Status:** awaiting owner approval
- **Author:** agent (from a brainstorming conversation with the owner)

## Intent and why

A personal reference chart: one connected, zoomable family tree of the English
royal line, from **Ealhmund of Kent** to **Charles III**. It's a toy the owner
will use to remind themselves which monarch is which. It is not a public
showpiece, so it optimises for completeness and legibility rather than
onboarding strangers.

Success: the owner opens one page, pans and zooms a single pedigree, and clicks
any monarch to get a quick "who was this again" card.

## Goals

- Show every monarch on the owner's English royal line in one connected chart.
- Make blood links and marriage links visually distinct.
- Click a monarch → its node expands in place into a fact card; the tree reflows
  around it.
- Include **only** the monarchs connected by blood or marriage to the drawn
  line.
- Be data-driven, so adding people later needs no code change.

## Non-goals

- Scottish monarchs (they appear only as non-clickable connectors).
- The Danish kings (Cnut, Harold Harefoot, Harthacnut, Svein Forkbeard),
  Harold II, and the contested monarchs (Empress Matilda, Lady Jane Grey) —
  excluded for now, but see "Extensibility".
- Any editing UI, accounts, or sharing.
- Any backend work: this is a static, client-only feature.
- Mobile-first design (desktop is the target).

## Anti-goals

- A chart that is technically correct but impossible to read.
- A hand-placed layout that must be re-placed every time a node is added.
- A heavyweight dependency that bloats the site bundle for a personal toy.

## Constraints

- Lives in the existing React 18 + Vite 4 frontend, alongside the GURPS
  character creator. No Kotlin backend changes; static assets only.
- Must sit naturally in the existing site (shared Navbar, React Router).

## Decisions made by the owner

- **Scope:** English monarchs on the drawn line. Danish and contested monarchs
  are out.
- **Chart style:** orthogonal pedigree (option A from the mockups) — straight
  descent lines, siblings joined by a horizontal bar, spouses joined by a bar.
- **Click behaviour:** the node expands in place into the card, and the tree
  reflows (option A from the mockups). Not a side panel, not a modal, no
  overlay.
- **Predecessor / successor:** the real throne sequence, even when that person
  is not shown on the tree (e.g. William I's predecessor is Harold II).
- **Layout:** computed from the data, not hand-placed, so future additions
  re-lay-out automatically.
- **No** bloodline highlighting at all — no ancestor/descendant highlighting on
  hover, and none while a card is open. Hover is limited to a cursor affordance
  on monarch nodes.

## Decisions made by the agent (the owner can challenge these)

- New page in the frontend, route `/family-tree`, linked from the Navbar.
- Monarch data lives in a JSON file bundled with the frontend.
- Portraits from Wikimedia Commons (public-domain works), downloaded into the
  frontend's public assets and credited on the card.
- Desktop-first; should merely not break on a phone.
- Rendering approach — see "Left to the builder".

## The roster — monarchs (clickable)

Reign dates are the real English/British throne dates. This is the intended set;
exact ordering and any disputed details are settled during research.

**House of Wessex / early England**
Ealhmund of Kent (root) · Ecgberht (802–839) · Aethelwulf (839–858) ·
Aethelbald (858–860) · Aethelberht (860–866) · Aethelred I (866–871) ·
Alfred the Great (871–899) · Edward the Elder (899–924) · Aethelstan (924–939) ·
Edmund I (939–946) · Eadred (946–955) · Eadwig (955–959) · Edgar (959–975) ·
Edward the Martyr (975–978) · Aethelred II the Unready (978–1016) ·
Edmund II Ironside (1016) · Edward the Confessor (1042–1066)

**Norman**
William I (1066–1087) · William II (1087–1100) · Henry I (1100–1135) ·
Stephen (1135–1154)

**Plantagenet**
Henry II (1154–1189) · Richard I (1189–1199) · John (1199–1216) ·
Henry III (1216–1272) · Edward I (1272–1307) · Edward II (1307–1327) ·
Edward III (1327–1377) · Richard II (1377–1399)

**Lancaster**
Henry IV (1399–1413) · Henry V (1413–1422) · Henry VI (1422–1461, 1470–1471)

**York**
Edward IV (1461–1470, 1471–1483) · Edward V (1483) · Richard III (1483–1485)

**Tudor**
Henry VII (1485–1509) · Henry VIII (1509–1547) · Edward VI (1547–1553) ·
Mary I (1553–1558) · Elizabeth I (1558–1603)

**Stuart**
James I (1603–1625) · Charles I (1625–1649) · Charles II (1660–1685) ·
James II (1685–1688) · William III (1689–1702) · Mary II (1689–1694) ·
Anne (1702–1714)

**Hanover**
George I (1714–1727) · George II (1727–1760) · George III (1760–1820) ·
George IV (1820–1830) · William IV (1830–1837)

**Saxe-Coburg & Gotha / Windsor**
Victoria (1837–1901) · Edward VII (1901–1910) · George V (1910–1936) ·
Edward VIII (1936) · George VI (1936–1952) · Elizabeth II (1952–2022) ·
Charles III (2022–present)

## The roster — connector figures (not clickable)

Non-royal (or non-English) stepping stones that carry the lineage between
monarchs. Drawn in a quieter style and inert on click.

Richard the Fearless, Duke of Normandy · Richard, Duke of Normandy ·
Robert the Magnificent · Emma of Normandy · Adela of Blois ·
Edward the Black Prince · John of Gaunt · Edmund of Langley ·
Richard of Conisburgh · Richard, Duke of York · John Beaufort (Earl of
Somerset) · John Beaufort (Duke of Somerset) · Margaret Beaufort ·
Margaret Tudor · James V of Scotland · Mary, Queen of Scots ·
Margaret Douglas · Henry Stuart, Lord Darnley · Elizabeth Stuart ·
Sophia of Hanover · Frederick, Prince of Wales · Edward, Duke of Kent.

(The exact connector set — including anyone needed to make a link legible,
such as Katherine Swynford — is finalised during research.)

## Data model

Two arrays. "Families" group a couple and their children, which maps one-to-one
onto the sibling bar drawn in style A — so the drawing step is mechanical.

```json
{
  "people": [
    {
      "id": "alfred",
      "name": "Alfred the Great",
      "kind": "monarch",
      "sex": "male",
      "house": "House of Wessex",
      "reign": "871-899",
      "predecessor": "Aethelred I",
      "successor": "Edward the Elder",
      "summary": "One short paragraph.",
      "portrait": "alfred-the-great.jpg",
      "portraitCredit": "Wikimedia Commons, public domain"
    }
  ],
  "families": [
    {
      "id": "f-aethelwulf",
      "husbandId": "aethelwulf",
      "wifeId": null,
      "childIds": ["aethelbald", "aethelberht", "aethelred1", "alfred"]
    },
    {
      "id": "f-aethelred2-firstwife",
      "husbandId": "aethelred2",
      "wifeId": null,
      "childIds": ["edmund2"]
    },
    {
      "id": "f-aethelred2-emma",
      "husbandId": "aethelred2",
      "wifeId": "emma",
      "childIds": ["edward-confessor"]
    }
  ]
}
```

- `kind` is `"monarch"` (clickable, card-capable) or `"connector"` (inert).
- `sex` is needed for pedigree layout (which spouse sits on which side).
- A person's parents are implied by the families they appear in as a child.
- A person may appear in **more than one family** (Aethelred II is in two
  above). Only line-carrying spouses get a drawn connector; an undrawn spouse
  is `wifeId: null` (or `husbandId: null`). This keeps the drawing convention
  while leaving the schema ready for drawing those spouses later, or for
  adding Cnut.
- A person with no parents and no spousal family is a root (Ealhmund).

## Layout (computed)

1. **Generations:** assign each person a generation as the longest path from the
   root over family links, so every parent sits above its children.
2. **Ordering:** within a generation, monarchs are ordered **left-to-right in
   order of succession** (by accession date). Spouses are placed adjacent to
   their partner, **on the side facing the offspring they share**, so a
   marriage's children hang consistently from the correct side. Worked
   example: Aethelred II's left-hand child is Edmund II Ironside (by an undrawn
   wife) and his right-hand child is Edward the Confessor (by Emma), so **Emma
   sits to Aethelred's right** — the reverse of the hand-drawn version. A
   barycenter / median pass then tidies any remaining crossings.
3. **Positions:** allocate horizontal space per subtree, place couples
   side-by-side, centre a family's children under their couple, and draw the
   orthogonal bars.
4. **On expand:** reserve the open card's footprint, recompute, and animate the
   transition so the reflow reads as motion rather than a jump.
5. **Extensibility:** adding a person = one `person` record plus a `family`;
   the layout recomputes with no code change.

## Interaction

- Pan by dragging; zoom by wheel or pinch; a control to fit the chart to the
  window / reset.
- Click a monarch → expand its card in place and reflow. Click its close
  affordance or elsewhere → collapse.
- Connector nodes are not clickable and have no hover affordance beyond a
  cursor hint.

## Fact card

Portrait, name, house, reign dates, predecessor, successor, and a short summary
paragraph. (As mocked: portrait top-left, name + house + reign beside it,
predecessor/successor beneath, summary under that.)

## Extensibility (why this matters)

The owner asked how hard it would be to add the Danish kings later. With a
computed layout and the family-based data model, it's a data edit: the
connections already exist in the tree (Emma of Normandy is the hinge for Cnut,
Harold Harefoot and Harthacnut; Harold II attaches via the Godwinsons), so
adding them means adding records, a portrait, and a family — the chart
re-lays-out itself.

## Settled after a builder review

These were raised by the reviewing builder and decided here (not left open):

- **Route:** public `/family-tree`, not wrapped in the auth-guarded routes.
- **Data loading:** the JSON sits in `frontend/src/data/` and is imported as a
  static module — no fetch, no backend.
- **Shape of the graph:** the chart is a *forest*, not a single tree. Several
  chains feed the main line (notably the Norman ducal descent that joins via
  Emma of Normandy), so the layout must handle multiple roots and
  connect-by-marriage joining, not assume one root at the top.
- **Highlighting:** none — see the owner's decision above.

## Marriage handling (decided)

Chosen: **the drawing's convention** — a spouse is drawn as a connector only
when they carry the lineage onward (Emma of Normandy, Adela of Blois, Sophia of
Hanover...). Non-line-carrying spouses are not drawn; their children attach to
the monarch directly, via a family record with a null spouse id.

But the model does **not** collapse to one family per person. Where two children
of the same monarch have different mothers, they come from separate families.
The Aethelred II case is the worked example:

- Edmund II Ironside descends from **Aethelred alone** (undrawn first wife).
- Edward the Confessor descends from the **Aethelred II + Emma marriage**.

So only Edward hangs off the marriage line. Emma is drawn, and sits on
Aethelred's right (see the ordering rule in "Layout"). This is the drawing's
visual convention running on the fuller schema, so drawing the remaining wives
later — or adding Cnut — needs no schema change.

## Left to the builder

- The exact layout algorithm and crossing-reduction pass.
- The rendering approach: a bespoke SVG pedigree with a lightweight pan/zoom
  handler, versus a graph library (e.g. React Flow) with custom node and edge
  types. The orthogonal sibling-bar style must be reproducible in whichever is
  chosen.
- How components are split, and the file/folder layout inside the frontend.
- The method for sourcing and downscaling the portraits.
- Testing approach (there is little logic to unit-test beyond the layout maths,
  which is worth covering).

## Out of scope

Scottish monarchs as clickable; the Danish kings; contested monarchs; editing;
accounts; a backend; a mobile-specific layout.
