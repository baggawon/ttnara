import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { trade_rank } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface RankBatchCreateProps {
  ranks: Array<{
    rank_level: number;
    min_trade_count: number;
  }>;
}

export const POST = async (json: RankBatchCreateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const result = await handleConnect(async (prisma) => {
      // Use transaction to ensure all operations succeed or none do
      return await prisma.$transaction(async (tx) => {
        // 1. Delete all existing ranks
        await tx.trade_rank.deleteMany({});

        // 2. Create all new ranks in a single batch operation
        await tx.trade_rank.createMany({
          data: json.ranks.map((rank) => ({
            rank_level: rank.rank_level,
            min_trade_count: rank.min_trade_count,
            name: null,
            description: null,
            badge_image: null,
            is_active: true,
          })),
        });

        // 3. Return the created ranks in correct order
        return await tx.trade_rank.findMany({
          orderBy: {
            rank_level: "asc",
          },
        });
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
