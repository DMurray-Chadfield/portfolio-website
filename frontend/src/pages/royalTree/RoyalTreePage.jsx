import { useState } from "react"
import royalFamilyTree from "../../data/royalFamilyTree.json"
import TreeCanvas from "./TreeCanvas.jsx"

function RoyalTreePage() {
  const [expandedId, setExpandedId] = useState(null)

  return (
    <section className="royal-tree-page">
      <header className="royal-tree-header">
        <p className="eyebrow">English Royal Line</p>
        <h1>Royal Family Tree</h1>
        <p className="royal-tree-subtitle">
          One connected, zoomable pedigree of the English royal line, from Ealhmund
          of Kent to Charles III.
        </p>
      </header>
      <TreeCanvas data={royalFamilyTree} expandedId={expandedId} onSelect={setExpandedId} />
    </section>
  )
}

export default RoyalTreePage
