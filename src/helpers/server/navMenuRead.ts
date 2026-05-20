import { cache } from "react";
import { handleConnect } from "@/helpers/server/prisma";
import { seedNavMenuIfEmpty } from "@/helpers/server/navMenuSeed";
import type { nav_menu_item } from "@prisma/client";

export type NavSurface = "top" | "mobile_bottom";
export type NavMenuKind = "link" | "home" | "chat_toggle";

export interface NavItem {
  id: number;
  kind: NavMenuKind;
  label: string;
  url: string;
  is_external: boolean;
  icon: string | null;
}

export interface NavParentItem extends NavItem {
  children: NavItem[];
}

// Reads straight from the DB. We deliberately skip appCache here because in
// dev (and certain prod setups) admin write paths and server-component read
// paths can resolve to different singleton instances, leaving the read side
// stale until a server restart. The menu is small (~15 rows) so the per-
// request DB hit is negligible, and React `cache()` dedups it within a single
// request.
const readSurfaceRows = cache(
  async (surface: NavSurface): Promise<nav_menu_item[]> => {
    await seedNavMenuIfEmpty();
    const rows = await handleConnect((prisma) =>
      prisma.nav_menu_item.findMany({
        where: { surface },
        orderBy: [{ parent_id: "asc" }, { display_order: "asc" }],
      })
    );
    return rows ?? [];
  }
);

export const getNavMenu = async (
  surface: NavSurface
): Promise<NavParentItem[]> => {
  const rows = await readSurfaceRows(surface);
  const active = rows.filter((r) => r.is_active);
  const parents = active
    .filter((r) => r.parent_id === null)
    .sort((a, b) => a.display_order - b.display_order);
  return parents.map((parent) => ({
    id: parent.id,
    kind: parent.kind as NavMenuKind,
    label: parent.label,
    url: parent.url,
    is_external: parent.is_external,
    icon: parent.icon,
    children: active
      .filter((r) => r.parent_id === parent.id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((c) => ({
        id: c.id,
        kind: c.kind as NavMenuKind,
        label: c.label,
        url: c.url,
        is_external: c.is_external,
        icon: c.icon,
      })),
  }));
};
