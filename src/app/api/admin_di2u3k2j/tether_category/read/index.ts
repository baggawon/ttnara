import type { tether_category } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";

export interface TetherCategoryListResponse {
  tetherCategories: tether_category[];
}

export interface TetherCategoryReadProps {}

async function getTetherCategories(
  queryParams: any
): Promise<TetherCategoryListResponse> {
  const tetherCategories = await handleConnect((prisma) =>
    prisma.tether_category.findMany()
  );
  if (!tetherCategories) throw ToastData.unknown;

  return {
    tetherCategories,
  };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getTetherCategories(queryParams);
    return {
      result: true,
      data: response,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
}
