import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { category } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface topicCategoriesUpdateProps extends category {}

export const POST = async (json: topicCategoriesUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const updateResult = await handleConnect((prisma) =>
      json.id === 0
        ? prisma.category.create({
            data: {
              ...removeColumnsFromObject(json, [
                "id",
                "created_at",
                "updated_at",
              ]),
            },
          })
        : prisma.category.update({
            where: {
              id: json.id,
            },
            data: {
              ...removeColumnsFromObject(json, [
                "id",
                "created_at",
                "updated_at",
              ]),
            },
          })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.Topics);
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
