import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { revalidatePath } from "next/cache";

export type NavSurface = "top" | "mobile_bottom";

export interface NavMenuCreateProps {
  surface: NavSurface;
  parent_id: number | null;
  label: string;
  url: string;
  is_external: boolean;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

const validateInput = async (json: NavMenuCreateProps) => {
  if (json.surface !== "top" && json.surface !== "mobile_bottom") {
    throw "잘못된 surface 값입니다.";
  }
  if (!json.label || json.label.trim().length === 0) {
    throw "메뉴 이름을 입력해주세요.";
  }
  if (json.surface === "mobile_bottom" && json.parent_id !== null) {
    throw "모바일 하단 메뉴는 부모 메뉴를 가질 수 없습니다.";
  }
  // url is optional only for top-level top items that are pure parents (have children).
  // Validate when present.
  const url = (json.url ?? "").trim();
  if (url.length > 0) {
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
  if (json.parent_id != null) {
    const parent = await handleConnect((prisma) =>
      prisma.nav_menu_item.findUnique({ where: { id: json.parent_id! } })
    );
    if (!parent) throw "상위 메뉴를 찾을 수 없습니다.";
    if (parent.surface !== json.surface) {
      throw "상위 메뉴의 surface 가 다릅니다.";
    }
    if (parent.parent_id !== null) {
      throw "메뉴는 1단계까지만 중첩 가능합니다.";
    }
  }
};

export const POST = async (json: NavMenuCreateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);
    await validateInput(json);

    const created = await handleConnect((prisma) =>
      prisma.nav_menu_item.create({
        data: {
          surface: json.surface,
          // System kinds (home, chat_toggle) are seeded only — admin-created
          // items are always kind="link".
          kind: "link",
          parent_id: json.parent_id ?? null,
          label: json.label.trim(),
          url: (json.url ?? "").trim(),
          is_external: !!json.is_external,
          icon: json.icon ? json.icon.trim() : null,
          display_order: json.display_order ?? 1,
          is_active: json.is_active ?? true,
        },
      })
    );
    if (!created) throw ToastData.unknown;

    revalidatePath("/", "layout");

    return { result: true, isSuccess: true, data: created };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      message: String(error),
    };
  }
};
