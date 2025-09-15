import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { trade_rank } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface RanksBatchEditRequest {
  rangeStart: number;
  rangeEnd: number;
  updates: {
    name?: string;
    badge_image?: string;
    description?: string;
  };
}

export const POST = async (json: RanksBatchEditRequest) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const result = await handleConnect(async (prisma) => {
      // Use transaction to ensure all operations succeed or none do
      return await prisma.$transaction(async (tx) => {
        // 1. Get all ranks within the range
        const ranksToUpdate = await tx.trade_rank.findMany({
          where: {
            rank_level: {
              gte: json.rangeStart,
              lte: json.rangeEnd,
            },
          },
          orderBy: {
            rank_level: "asc",
          },
        });

        if (ranksToUpdate.length === 0) {
          throw ToastData.rankBatchEdit;
        }

        // 2. Update all ranks in the range
        const updatePromises = ranksToUpdate.map((rank) => {
          const updates: Partial<trade_rank> = {};

          if (json.updates.name) {
            // updates.name = `${json.updates.name} ${rank.rank_level}`;
            updates.name = json.updates.name;
          }
          if (json.updates.badge_image !== undefined) {
            updates.badge_image = json.updates.badge_image;
          }
          if (json.updates.description) {
            // updates.description = `${json.updates.description} ${rank.rank_level}`;
            updates.description = json.updates.description;
          }

          return tx.trade_rank.update({
            where: { id: rank.id },
            data: updates,
          });
        });

        const updatedRanks = await Promise.all(updatePromises);

        return updatedRanks;
      });
    });

    if (!result) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.TradeRanks);

    return {
      result: true,
      data: result,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
