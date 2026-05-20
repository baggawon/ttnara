import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface TetherCategoryDeleteProps {
  deleteTetherCategoryId: number;
}

export const POST = async (json: TetherCategoryDeleteProps) => {
  try {
    if (typeof json?.deleteTetherCategoryId !== "number")
      throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const updateResult = await handleConnect((prisma) =>
      prisma.tether_category.updateMany({
        where: {
          OR: [
            { id: json.deleteTetherCategoryId },
            { parent_id: json.deleteTetherCategoryId },
          ],
        },
        data: { is_active: false },
      })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.TetherCategories);
    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
