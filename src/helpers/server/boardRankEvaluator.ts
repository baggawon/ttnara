import type { PrismaClient, Prisma } from "@prisma/client";

type BoardRankInfo = {
  rank_level: number;
  name: string | null;
  badge_image: string | null;
};

/**
 * Evaluates the appropriate board rank level for a given board point balance.
 *
 * Board rank tracks the user's CURRENT `profile.point` balance (a spendable
 * balance), so this is re-run on every balance change — up and down.
 *
 * @param prisma PrismaClient instance or transaction context
 * @param point Current board point balance (profile.point)
 * @returns The appropriate board rank info
 */
export async function evaluateBoardRankLevel(
  prisma: PrismaClient | Prisma.TransactionClient,
  point: number
): Promise<BoardRankInfo> {
  // Get all active board ranks ordered by min_point ascending
  const ranks = await prisma.board_rank.findMany({
    where: {
      is_active: true,
    },
    orderBy: {
      min_point: "asc",
    },
  });

  // Find the highest rank where the user meets the minimum point requirement
  let highestMatchingRank = null;
  for (const rank of ranks) {
    if (point >= rank.min_point) {
      highestMatchingRank = rank;
    } else {
      break; // Stop when we find a rank requirement we don't meet
    }
  }

  if (!highestMatchingRank) {
    return {
      rank_level: 1,
      name: null,
      badge_image: null,
    };
  }

  return {
    rank_level: highestMatchingRank.rank_level,
    name: highestMatchingRank.name,
    badge_image: highestMatchingRank.badge_image,
  };
}

/**
 * Updates a user's board rank based on their current board point balance.
 * @param prisma PrismaClient instance or transaction context
 * @param uid User ID to update
 * @param point Current board point balance
 */
export async function updateUserBoardRank(
  prisma: PrismaClient | Prisma.TransactionClient,
  uid: string,
  point: number
): Promise<void> {
  const rankInfo = await evaluateBoardRankLevel(prisma, point);

  await prisma.profile.update({
    where: { uid },
    data: {
      current_board_rank_level: rankInfo.rank_level,
      current_board_rank_name: rankInfo.name,
      current_board_rank_image: rankInfo.badge_image,
    },
  });
}

/**
 * Re-derives the denormalized board-rank snapshot (`current_board_rank_*`) on
 * EVERY profile from the current `board_rank` table + each user's `point`.
 *
 * Mirrors {@link reevaluateAllUserRanks} for the board side. Per-user updates
 * only run on a point change, so an admin change to the rank *structure* leaves
 * existing profiles on stale names/badges (including deleted-rank "ghost"
 * images). Call this after any board-rank structure mutation. `point` lives
 * directly on `profile`, so the per-tier filter needs no relation join.
 */
export async function reevaluateAllUserBoardRanks(
  prisma: PrismaClient | Prisma.TransactionClient
): Promise<void> {
  const ranks = await prisma.board_rank.findMany({
    where: { is_active: true },
    orderBy: { min_point: "asc" },
  });

  await prisma.profile.updateMany({
    data: {
      current_board_rank_level: 1,
      current_board_rank_name: null,
      current_board_rank_image: null,
    },
  });

  for (const rank of ranks) {
    await prisma.profile.updateMany({
      where: { point: { gte: rank.min_point } },
      data: {
        current_board_rank_level: rank.rank_level,
        current_board_rank_name: rank.name,
        current_board_rank_image: rank.badge_image,
      },
    });
  }
}
