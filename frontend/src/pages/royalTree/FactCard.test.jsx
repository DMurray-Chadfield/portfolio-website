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

  it("falls back to a monogram when the portrait file is absent from the data", () => {
    const noPortrait = Object.fromEntries(Object.entries(person).filter(([key]) => key !== "portrait"))
    const html = renderToStaticMarkup(<FactCard person={noPortrait} onClose={() => {}} />)
    expect(html).toContain("royal-tree-monogram")
  })

  it("shows the portrait credit verbatim when present and omits it when absent", () => {
    const credit = "Workshop of Hans Holbein the Younger, portrait of Henry VIII, public domain (via Wikimedia Commons)"
    const withCredit = { ...person, portrait: "william1.jpg", portraitCredit: credit }
    const html = renderToStaticMarkup(<FactCard person={withCredit} onClose={() => {}} />)
    expect(html).toContain(credit)
    expect(html).toContain("royal-tree-credit")
    const without = renderToStaticMarkup(<FactCard person={person} onClose={() => {}} />)
    expect(without).not.toContain(credit)
    expect(without).not.toContain("royal-tree-credit")
  })
})
