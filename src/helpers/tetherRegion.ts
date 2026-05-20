import type { tether_category } from "@prisma/client";
import type { TetherRegionSelectionWithCategory } from "@/app/api/tethers/read";

type CategoryLike = Pick<tether_category, "name" | "parent_id">;

export const formatRegionLabel = (
  category: CategoryLike | null | undefined,
  allCategories: tether_category[]
): string => {
  if (!category) return "";
  if (category.parent_id === null) return category.name;
  const parent = allCategories.find((c) => c.id === category.parent_id);
  return parent ? `${parent.name} ${category.name}` : category.name;
};

export interface RegionGroup {
  parentId: number;
  parentName: string;
  children: TetherRegionSelectionWithCategory[];
}

/**
 * Groups region_selections by parent region. A selection that points at a
 * top-level (parent) category becomes its own group with no children. A
 * selection pointing at a leaf category is bucketed under its parent.
 *
 * Groups are ordered to match the admin-defined parent order
 * (i.e. their position within `allCategories`).
 */
export const groupRegions = (
  regions: TetherRegionSelectionWithCategory[],
  allCategories: tether_category[]
): RegionGroup[] => {
  const groups = new Map<number, RegionGroup>();

  for (const r of regions) {
    const cat = r.category;
    if (!cat) continue;
    if (cat.parent_id === null) {
      if (!groups.has(cat.id)) {
        groups.set(cat.id, {
          parentId: cat.id,
          parentName: cat.name,
          children: [],
        });
      }
      continue;
    }
    const parentName =
      allCategories.find((c) => c.id === cat.parent_id)?.name ?? cat.name;
    const existing = groups.get(cat.parent_id);
    if (existing) {
      existing.children.push(r);
    } else {
      groups.set(cat.parent_id, {
        parentId: cat.parent_id,
        parentName,
        children: [r],
      });
    }
  }

  const orderIndex = new Map(allCategories.map((c, i) => [c.id, i] as const));
  return Array.from(groups.values()).sort((a, b) => {
    const ai = orderIndex.get(a.parentId) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.get(b.parentId) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
};
