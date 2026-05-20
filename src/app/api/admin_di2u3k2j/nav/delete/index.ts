import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { revalidatePath } from "next/cache";

export interface NavMenuDeleteProps {
  id: number;
}

export const POST = async (json: NavMenuDeleteProps) => {
  try {
    if (typeof json?.id !== "number" || json.id <= 0) throw ToastData.unknown;
    await requestValidator([RequestValidator.Admin], json);

    const existing = await handleConnect((prisma) =>
      prisma.nav_menu_item.findUnique({ where: { id: json.id } })
    );
    if (!existing) throw "메뉴 항목을 찾을 수 없습니다.";
    if (existing.kind !== "link") {
      throw "시스템 메뉴는 삭제할 수 없습니다. 비활성화로 숨길 수 있습니다.";
    }

    await handleConnect((prisma) =>
      prisma.nav_menu_item.delete({ where: { id: json.id } })
    );

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
