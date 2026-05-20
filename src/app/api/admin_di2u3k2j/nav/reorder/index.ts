import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { revalidatePath } from "next/cache";
import type { NavSurface } from "@/app/api/admin_di2u3k2j/nav/create";

export interface NavMenuReorderProps {
  surface: NavSurface;
  // ordered list of item ids; index becomes display_order (1-based)
  orderedIds: number[];
  // optional scope: parent_id; null = top-level for the surface
  parent_id: number | null;
}

export const POST = async (json: NavMenuReorderProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);
    if (json.surface !== "top" && json.surface !== "mobile_bottom") {
      throw "잘못된 surface 값입니다.";
    }
    if (!Array.isArray(json.orderedIds)) throw ToastData.unknown;

    // Validate all ids belong to the same surface and parent scope
    const items = await handleConnect((prisma) =>
      prisma.nav_menu_item.findMany({
        where: { id: { in: json.orderedIds } },
      })
    );
    if (!items || items.length !== json.orderedIds.length) {
      throw "일부 메뉴 항목을 찾을 수 없습니다.";
    }
    for (const item of items) {
      if (item.surface !== json.surface) {
        throw "다른 surface 의 항목이 포함되어 있습니다.";
      }
      if ((item.parent_id ?? null) !== (json.parent_id ?? null)) {
        throw "다른 부모를 가진 항목이 포함되어 있습니다.";
      }
    }

    const writeResult = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        for (let i = 0; i < json.orderedIds.length; i++) {
          await tx.nav_menu_item.update({
            where: { id: json.orderedIds[i] },
            data: { display_order: i + 1 },
          });
        }
        return json.orderedIds.length;
      })
    );

    // handleConnect swallows errors and returns undefined on failure, so a
    // missing return value here means the transaction silently rolled back.
    if (typeof writeResult !== "number") {
      throw "메뉴 순서 저장 중 오류가 발생했습니다.";
    }

    revalidatePath("/", "layout");

    return { result: true, isSuccess: true };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      message: String(error),
    };
  }
};
