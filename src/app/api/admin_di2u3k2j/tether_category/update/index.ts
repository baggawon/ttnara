import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { tether_category } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface TetherCategoryUpdateProps extends tether_category {}

export const POST = async (json: TetherCategoryUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const updateResult = await handleConnect((prisma) =>
      json.id === 0
        ? prisma.tether_category.create({
            data: {
              ...removeColumnsFromObject(json, ["id"]),
            },
          })
        : prisma.tether_category.update({
            where: {
              id: json.id,
            },
            data: {
              ...removeColumnsFromObject(json, ["id"]),
            },
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
