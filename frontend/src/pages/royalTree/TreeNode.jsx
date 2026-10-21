import FactCard from "./FactCard.jsx"

function TreeNode({ node, expanded, onSelect, animating = false, cardRef = null }) {
  return (
    <div
      className="royal-tree-node"
      style={{
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        overflow: animating ? "hidden" : "visible"
      }}
    >
      {expanded ? (
        <FactCard person={node.person} onClose={() => onSelect(null)} cardRef={cardRef} />
      ) : node.kind === "monarch" ? (
        <button
          type="button"
          className="royal-tree-chip royal-tree-chip-monarch"
          onClick={() => onSelect(node.id)}
        >
          <span className="royal-tree-chip-label">{node.person.name}</span>
        </button>
      ) : (
        <div className="royal-tree-chip royal-tree-chip-connector">
          <span className="royal-tree-chip-label">{node.person.name}</span>
        </div>
      )}
    </div>
  )
}

export default TreeNode
