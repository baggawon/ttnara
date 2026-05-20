import { handleConnect } from "@/helpers/server/prisma";
import { seedNavMenuIfEmpty } from "@/helpers/server/navMenuSeed";
import type { nav_menu_item } from "@prisma/client";

export type NavSurface = "top" | "mobile_bottom";
export type NavMenuKind = "link" | "home" | "chat_toggle";

export interface NavMenuPublicChild {
  id: number;
  kind: NavMenuKind;
  label: string;
  url: string;
  is_external: boolean;
  icon: string | null;
}

export interface NavMenuPublicItem extends NavMenuPublicChild {
  children: NavMenuPublicChild[];
}

export interface NavMenuPublicResponse {
  surface: NavSurface;
  items: NavMenuPublicItem[];
}

export interface NavMenuPublicReadProps {
  surface?: string;
}

const readSurfaceItems = async (
  surface: NavSurface
): Promise<nav_menu_item[]> => {
  await seedNavMenuIfEmpty();
  const items = await handleConnect((prisma) =>
    prisma.nav_menu_item.findMany({
      where: { surface },
      orderBy: [{ parent_id: "asc" }, { display_order: "asc" }],
    })
  );
  return items ?? [];
};

const buildTree = (rows: nav_menu_item[]): NavMenuPublicItem[] => {
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

export const GET = async (queryParams: NavMenuPublicReadProps) => {
  try {
    const surface =
      queryParams?.surface === "mobile_bottom" ? "mobile_bottom" : "top";
    const rows = await readSurfaceItems(surface);
    const data: NavMenuPublicResponse = {
      surface,
      items: buildTree(rows),
    };
    return { result: true, data };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
