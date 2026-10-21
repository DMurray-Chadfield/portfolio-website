function keepsWalk(graph, id, spouseIds) {
  const monarchIds = [id, ...spouseIds].filter((other) => graph.personById.get(other).kind === "monarch")
  if (monarchIds.length === 1) return graph.personById.get(id).kind === "monarch"
  return graph.personById.get(id).sex !== "female"
}

export function buildClusters(graph) {
  const people = [...graph.personById.values()]
  const parents = new Map(people.map((person) => [person.id, person.id]))

  const find = (id) => {
    let root = id
    while (parents.get(root) !== root) root = parents.get(root)
    let cursor = id
    while (parents.get(cursor) !== root) {
      const next = parents.get(cursor)
      parents.set(cursor, root)
      cursor = next
    }
    return root
  }

  const union = (a, b) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parents.set(rootB, rootA)
  }

  for (const person of people) {
    for (const spouseId of graph.spouseIdsOf(person.id)) union(person.id, spouseId)
  }

  const membersById = new Map()
  for (const person of people) {
    const root = find(person.id)
    if (!membersById.has(root)) membersById.set(root, [])
    membersById.get(root).push(person.id)
  }

  const clusterById = new Map()
  const clusterIdOfPerson = new Map()
  for (const [id, memberIds] of membersById) {
    const keepers = memberIds.filter((memberId) =>
      keepsWalk(graph, memberId, memberIds.filter((other) => other !== memberId))
    )
    const primary = (keepers.length > 0 ? keepers : memberIds)[0]
    const orderedMembers = [primary, ...memberIds.filter((memberId) => memberId !== primary)]
    const familyIds = []
    for (const memberId of orderedMembers) {
      for (const familyId of graph.familyIdsOf(memberId)) {
        if (!familyIds.includes(familyId)) familyIds.push(familyId)
      }
    }
    const childIds = []
    for (const familyId of familyIds) {
      for (const childId of graph.childrenOfFamily(familyId)) {
        if (!childIds.includes(childId)) childIds.push(childId)
      }
    }
    clusterById.set(id, { id, memberIds: orderedMembers, familyIds, childIds, birthClusterId: null })
    for (const memberId of orderedMembers) clusterIdOfPerson.set(memberId, id)
  }

  for (const cluster of clusterById.values()) {
    const bornMembers = cluster.memberIds
      .filter((memberId) => graph.parentIdsOf(memberId).length > 0)
      .map((memberId) => ({ memberId, clusterId: find(graph.parentIdsOf(memberId)[0]) }))
    if (bornMembers.length === 0) continue
    const chosen = bornMembers.find((entry) => entry.memberId === cluster.memberIds[0]) ?? bornMembers[0]
    cluster.birthClusterId = chosen.clusterId
  }

  const peopleIndex = new Map(people.map((person, index) => [person.id, index]))
  const rootClusterIds = [...clusterById.values()]
    .filter((cluster) => cluster.birthClusterId == null)
    .sort((a, b) => peopleIndex.get(a.memberIds[0]) - peopleIndex.get(b.memberIds[0]))
    .map((cluster) => cluster.id)

  const childClustersOf = (cluster) => {
    const childClusterIds = []
    for (const childId of cluster.childIds) {
      const childCluster = clusterById.get(clusterIdOfPerson.get(childId))
      if (childCluster?.birthClusterId !== cluster.id || childClusterIds.includes(childCluster.id)) continue
      childClusterIds.push(childCluster.id)
    }
    return childClusterIds
  }

  const preOrder = new Map()
  let nextIndex = 0
  const visit = (clusterId) => {
    if (preOrder.has(clusterId)) return
    preOrder.set(clusterId, nextIndex++)
    for (const childClusterId of childClustersOf(clusterById.get(clusterId))) visit(childClusterId)
  }
  for (const rootClusterId of rootClusterIds) visit(rootClusterId)

  for (const cluster of clusterById.values()) {
    if (cluster.memberIds.length !== 2 || cluster.birthClusterId == null) continue
    const crossMemberId = cluster.memberIds.find((memberId) => {
      const parentIds = graph.parentIdsOf(memberId)
      return parentIds.length > 0 && find(parentIds[0]) !== cluster.birthClusterId
    })
    if (crossMemberId == null) continue
    const crossClusterId = find(graph.parentIdsOf(crossMemberId)[0])
    const otherMemberId = cluster.memberIds.find((memberId) => memberId !== crossMemberId)
    cluster.memberIds = preOrder.get(crossClusterId) < preOrder.get(cluster.birthClusterId)
      ? [crossMemberId, otherMemberId]
      : [otherMemberId, crossMemberId]
  }

  return { clusterById, clusterIdOfPerson, rootClusterIds }
}
