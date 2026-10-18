import FactCard from "./FactCard.jsx"

function TreeNode({ node, expanded, onSelect }) {
  return (
    <div
      className="royal-tree-node"
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      {expanded ? (
        <FactCard person={node.person} onClose={() => onSelect(null)} />
      ) : node.kind === "monarch" ? (
        <button
          type="button"
          className="royal-tree-chip royal-tree-chip-monarch"
          onClick={() => onSelect(node.id)}
        >
          {node.person.name}
        </button>
      ) : (
        <div className="royal-tree-chip royal-tree-chip-connector">{node.person.name}</div>
      )}
    </div>
  )
}

export default TreeNode
