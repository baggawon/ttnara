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

    const isCreate = json.id === 0;
    const trimmedName = typeof json.name === "string" ? json.name.trim() : "";

    if (trimmedName) {
      const parentIdScope =
        json.parent_id === null || json.parent_id === undefined
          ? null
          : json.parent_id;
      const existing = await handleConnect((prisma) =>
        prisma.tether_category.findFirst({
          where: { name: trimmedName, parent_id: parentIdScope },
          select: { id: true, is_active: true },
        })
      );
      if (existing && (isCreate || existing.id !== json.id)) {
        if (existing.is_active === false) {
          throw ToastData.tetherCategoryDuplicateDeleted;
        }
        throw parentIdScope === null
          ? ToastData.tetherCategoryDuplicateParent
          : ToastData.tetherCategoryDuplicateChild;
      }
    }

    const updateResult = await handleConnect((prisma) =>
      isCreate
        ? prisma.tether_category.create({
            data: {
              ...removeColumnsFromObject(json, ["id"]),
              is_active: true,
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
