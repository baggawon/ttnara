import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface BoardRankBatchCreateProps {
  ranks: Array<{
    rank_level: number;
    min_point: number;
  }>;
}

export const POST = async (json: BoardRankBatchCreateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const result = await handleConnect(async (prisma) => {
      // Use transaction to ensure all operations succeed or none do
      return await prisma.$transaction(async (tx) => {
        // 1. Delete all existing ranks
        await tx.board_rank.deleteMany({});

        // 2. Create all new ranks in a single batch operation
        await tx.board_rank.createMany({
          data: json.ranks.map((rank) => ({
            rank_level: rank.rank_level,
            min_point: rank.min_point,
            name: null,
            description: null,
            badge_image: null,
            is_active: true,
          })),
        });

        // 3. Unassign all badge images (range no longer matches new rank set)
        await tx.board_rank_badge_image.updateMany({
          where: {
            OR: [
              { assigned_min_rank: { not: null } },
              { assigned_max_rank: { not: null } },
            ],
          },
          data: {
            assigned_min_rank: null,
            assigned_max_rank: null,
          },
        });

        // 4. Return the created ranks in correct order
        return await tx.board_rank.findMany({
          orderBy: {
            rank_level: "asc",
          },
        });
      });
    });

    if (!result) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.BoardRanks);

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
