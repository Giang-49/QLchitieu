export interface CategoryEdge {
  id: bigint;
  parent_id: bigint | null;
}

export function categoryBranch(tree: CategoryEdge[], root: bigint) {
  const ids = new Set([root]);
  for (const parent of ids) {
    for (const category of tree) {
      if (category.parent_id === parent) ids.add(category.id);
    }
  }
  return [...ids];
}

