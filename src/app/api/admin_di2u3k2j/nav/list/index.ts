import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import type { nav_menu_item } from "@prisma/client";

export interface NavMenuListResponse {
  top: nav_menu_item[];
  mobile_bottom: nav_menu_item[];
}

export interface NavMenuListProps {}

export const GET = async (queryParams: NavMenuListProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const items = await handleConnect((prisma) =>
      prisma.nav_menu_item.findMany({
        orderBy: [{ parent_id: "asc" }, { display_order: "asc" }],
      })
    );
    if (!items) throw ToastData.unknown;

    const grouped: NavMenuListResponse = {
      top: items.filter((item) => item.surface === "top"),
      mobile_bottom: items.filter((item) => item.surface === "mobile_bottom"),
    };

    return { result: true, isSuccess: true, data: grouped };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      message: String(error),
    };
  }
};
