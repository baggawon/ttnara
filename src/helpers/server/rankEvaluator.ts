import type { PrismaClient, Prisma } from "@prisma/client";

type RankInfo = {
  rank_level: number;
  name: string | null;
  badge_image: string | null;
};

/**
 * Evaluates the appropriate rank level for a given trade count
 * @param prisma PrismaClient instance or transaction context
 * @param tradeCount Number of trades completed
 * @returns The appropriate rank info
 */
export async function evaluateRankLevel(
  prisma: PrismaClient | Prisma.TransactionClient,
  tradeCount: number
): Promise<RankInfo> {
  // Get all active ranks ordered by min_trade_count ascending
  const ranks = await prisma.trade_rank.findMany({
    where: {
      is_active: true,
    },
    orderBy: {
      min_trade_count: "asc",
    },
  });

  // Find the highest rank where user meets the minimum trade count
  let highestMatchingRank = null;
  for (const rank of ranks) {
    if (tradeCount >= rank.min_trade_count) {
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
 * Updates a user's rank based on their trade count
 * @param prisma PrismaClient instance or transaction context
 * @param userId User ID to update
 * @param tradeCount Current trade count
 */
export async function updateUserRank(
  prisma: PrismaClient | Prisma.TransactionClient,
  uid: string,
  tradeCount: number
): Promise<void> {
  // Evaluate appropriate rank info
  const rankInfo = await evaluateRankLevel(prisma, tradeCount);

  // Update user's profile rank information
  await prisma.profile.update({
    where: { uid },
    data: {
      current_rank_level: rankInfo.rank_level,
      current_rank_name: rankInfo.name,
      current_rank_image: rankInfo.badge_image,
    },
  });
}

/**
 * Re-derives the denormalized trade-rank snapshot (`current_rank_*`) on EVERY
 * profile from the current `trade_rank` table + each user's `trade_count`.
 *
 * Per-user updates only run when that user trades, so any admin change to the
 * rank *structure* (batch replace, create, update, delete) leaves existing
 * profiles pointing at now-stale names/badges — including images of deleted
 * ranks ("ghost" badges). Call this after any such mutation so the snapshot
 * stays a pure function of (trade_count, rank table).
 *
 * Cost is O(active tiers) queries, independent of user count: reset everyone to
 * the no-rank baseline, then layer each tier on in ascending order so the
 * highest tier a user qualifies for wins the final write. Run inside the same
 * transaction as the rank mutation so it is atomic.
 */
export async function reevaluateAllUserRanks(
  prisma: PrismaClient | Prisma.TransactionClient
): Promise<void> {
  const ranks = await prisma.trade_rank.findMany({
    where: { is_active: true },
    orderBy: { min_trade_count: "asc" },
  });

  await prisma.profile.updateMany({
    data: {
      current_rank_level: 1,
      current_rank_name: null,
      current_rank_image: null,
    },
  });

  for (const rank of ranks) {
    await prisma.profile.updateMany({
      where: { user: { trade_count: { gte: rank.min_trade_count } } },
      data: {
        current_rank_level: rank.rank_level,
        current_rank_name: rank.name,
        current_rank_image: rank.badge_image,
      },
    });
  }
}
