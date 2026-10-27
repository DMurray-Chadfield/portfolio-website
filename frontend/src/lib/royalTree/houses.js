const HOUSE_COLORS = {
  "House of Wessex": "#a8732c",
  "House of Normandy": "#356f9f",
  "House of Blois": "#6d5a91",
  "House of Plantagenet": "#32785b",
  "House of Lancaster": "#a63d40",
  "House of York": "#b87927",
  "House of Tudor": "#7b5130",
  "House of Stuart": "#397b87",
  "House of Orange-Nassau": "#c96532",
  "House of Hanover": "#5e7a38",
  "House of Saxe-Coburg and Gotha": "#8464a0",
  "House of Windsor": "#3f5f9c"
}

const FALLBACK_COLOR = "#0f7c67"

export function buildHouseRegions(nodes, padding = 20) {
  const groups = new Map()

  for (const node of nodes) {
    if (node.kind !== "monarch" || !node.person?.house) continue
    const house = node.person.house
    const bounds = groups.get(house)
    if (bounds == null) {
      groups.set(house, {
        minX: node.x,
        minY: node.y,
        maxX: node.x + node.w,
        maxY: node.y + node.h
      })
    } else {
      bounds.minX = Math.min(bounds.minX, node.x)
      bounds.minY = Math.min(bounds.minY, node.y)
      bounds.maxX = Math.max(bounds.maxX, node.x + node.w)
      bounds.maxY = Math.max(bounds.maxY, node.y + node.h)
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([house, bounds]) => ({
      house,
      color: HOUSE_COLORS[house] ?? FALLBACK_COLOR,
      x: bounds.minX - padding,
      y: bounds.minY - padding,
      width: bounds.maxX - bounds.minX + padding * 2,
      height: bounds.maxY - bounds.minY + padding * 2
    }))
}
