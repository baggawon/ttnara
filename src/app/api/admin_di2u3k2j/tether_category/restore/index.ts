import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface TetherCategoryRestoreProps {
  restoreTetherCategoryId: number;
}

export const POST = async (json: TetherCategoryRestoreProps) => {
  try {
    if (typeof json?.restoreTetherCategoryId !== "number")
      throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const target = await handleConnect((prisma) =>
      prisma.tether_category.findUnique({
        where: { id: json.restoreTetherCategoryId },
        select: { id: true, name: true, parent_id: true },
      })
    );
    if (!target) throw ToastData.unknown;

    const idsToRestore: number[] = [target.id];

    const targetConflict = await handleConnect((prisma) =>
      prisma.tether_category.findFirst({
        where: {
          name: target.name,
          parent_id: target.parent_id,
          is_active: true,
          NOT: { id: target.id },
        },
        select: { id: true },
      })
    );
    if (targetConflict) throw ToastData.tetherCategoryRestoreConflict;

    if (target.parent_id !== null) {
      const parent = await handleConnect((prisma) =>
        prisma.tether_category.findUnique({
          where: { id: target.parent_id! },
          select: { id: true, name: true, is_active: true },
        })
      );
      if (parent && !parent.is_active) {
        const parentConflict = await handleConnect((prisma) =>
          prisma.tether_category.findFirst({
            where: {
              name: parent.name,
              parent_id: null,
              is_active: true,
              NOT: { id: parent.id },
            },
            select: { id: true },
          })
        );
        if (parentConflict) throw ToastData.tetherCategoryRestoreConflict;
        idsToRestore.push(parent.id);
      }
    }

    const restoreResult = await handleConnect((prisma) =>
      prisma.tether_category.updateMany({
        where: { id: { in: idsToRestore } },
        data: { is_active: true },
      })
    );
    if (!restoreResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.TetherCategories);
    return {
      result: true,
      message: ToastData.tetherCategoryRestore,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
