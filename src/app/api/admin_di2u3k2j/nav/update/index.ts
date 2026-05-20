import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { revalidatePath } from "next/cache";

export interface NavMenuUpdateProps {
  id: number;
  parent_id: number | null;
  label: string;
  url: string;
  is_external: boolean;
  icon: string | null;
  is_active: boolean;
}

export const POST = async (json: NavMenuUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json.id <= 0) throw ToastData.unknown;
    await requestValidator([RequestValidator.Admin], json);

    const existing = await handleConnect((prisma) =>
      prisma.nav_menu_item.findUnique({ where: { id: json.id } })
    );
    if (!existing) throw "메뉴 항목을 찾을 수 없습니다.";

    if (!json.label || json.label.trim().length === 0) {
      throw "메뉴 이름을 입력해주세요.";
    }

    const isSystem = existing.kind !== "link";

    // System items only allow label + is_active updates. url/icon/external/parent
    // are pinned to the seed values; ignore client overrides.
    const url = isSystem ? existing.url : (json.url ?? "").trim();
    if (!isSystem && url.length > 0) {
      if (json.is_external) {
        try {
          new URL(url);
        } catch {
          throw "외부 URL 형식이 올바르지 않습니다.";
        }
      } else if (!url.startsWith("/")) {
        throw "내부 경로는 '/'로 시작해야 합니다.";
      }
    }
    if (
      !isSystem &&
      existing.surface === "mobile_bottom" &&
      json.parent_id !== null
    ) {
      throw "모바일 하단 메뉴는 부모 메뉴를 가질 수 없습니다.";
    }
    if (!isSystem && json.parent_id != null) {
      if (json.parent_id === json.id)
        throw "자기 자신을 상위 메뉴로 지정할 수 없습니다.";
      const parent = await handleConnect((prisma) =>
        prisma.nav_menu_item.findUnique({ where: { id: json.parent_id! } })
      );
      if (!parent) throw "상위 메뉴를 찾을 수 없습니다.";
      if (parent.surface !== existing.surface)
        throw "상위 메뉴의 surface 가 다릅니다.";
      if (parent.parent_id !== null)
        throw "메뉴는 1단계까지만 중첩 가능합니다.";
      const childCount = await handleConnect((prisma) =>
        prisma.nav_menu_item.count({ where: { parent_id: json.id } })
      );
      if ((childCount ?? 0) > 0)
        throw "하위 메뉴가 있는 항목은 다른 메뉴의 하위로 이동할 수 없습니다.";
    }

    const updated = await handleConnect((prisma) =>
      prisma.nav_menu_item.update({
        where: { id: json.id },
        data: isSystem
          ? {
              label: json.label.trim(),
              is_active: json.is_active ?? true,
            }
          : {
              parent_id: json.parent_id ?? null,
              label: json.label.trim(),
              url,
              is_external: !!json.is_external,
              icon: json.icon ? json.icon.trim() : null,
              is_active: json.is_active ?? true,
            },
      })
    );
    if (!updated) throw ToastData.unknown;

    revalidatePath("/", "layout");

    return { result: true, isSuccess: true, data: updated };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      message: String(error),
    };
  }
};
