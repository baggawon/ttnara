import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface RankBadgeAssignProps {
  id: number;
  rangeStart: number;
  rangeEnd: number;
}

export interface RankBadgeAssignConflict {
  rank_level: number;
  badge_image: string | null;
}

export interface RankBadgeAssignResponseData {
  ok: boolean;
  conflict?: RankBadgeAssignConflict[];
  description?: string;
}

export const POST = async (json: RankBadgeAssignProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const id = Number(json.id);
    const rangeStart = Number(json.rangeStart);
    const rangeEnd = Number(json.rangeEnd);

    if (!Number.isFinite(id) || id <= 0) throw ToastData.unknown;
    if (
      !Number.isFinite(rangeStart) ||
      !Number.isFinite(rangeEnd) ||
      rangeStart > rangeEnd ||
      rangeStart < 1
    ) {
      throw ToastData.rankBadgeRangeInvalid;
    }

    const result = await handleConnect(async (prisma) => {
      return await prisma.$transaction(async (tx) => {
        const badge = await tx.rank_badge_image.findUnique({ where: { id } });
        if (!badge) throw ToastData.unknown;

        const conflictingRanks = await tx.trade_rank.findMany({
          where: {
            rank_level: { gte: rangeStart, lte: rangeEnd },
            badge_image: { not: null },
            NOT: { badge_image: badge.aws_cloud_front_url },
          },
          select: { rank_level: true, badge_image: true },
          orderBy: { rank_level: "asc" },
        });

        if (conflictingRanks.length > 0) {
          return { conflict: conflictingRanks };
        }

        // 1. Clear this badge's previous assignments outside the new range
        if (
          badge.assigned_min_rank !== null &&
          badge.assigned_max_rank !== null
        ) {
          await tx.trade_rank.updateMany({
            where: {
              badge_image: badge.aws_cloud_front_url,
              OR: [
                { rank_level: { lt: rangeStart } },
                { rank_level: { gt: rangeEnd } },
              ],
            },
            data: { badge_image: null },
          });

          // Keep the denormalized profile snapshot in sync: clear users who
          // still point at this badge but now fall outside the assigned range.
          await tx.profile.updateMany({
            where: {
              current_rank_image: badge.aws_cloud_front_url,
              OR: [
                { current_rank_level: { lt: rangeStart } },
                { current_rank_level: { gt: rangeEnd } },
              ],
            },
            data: { current_rank_image: null },
          });
        }

        // 2. Apply badge_image to all ranks in the new range
        await tx.trade_rank.updateMany({
          where: {
            rank_level: { gte: rangeStart, lte: rangeEnd },
          },
          data: { badge_image: badge.aws_cloud_front_url },
        });

        // Propagate to the denormalized profile snapshot so existing users at
        // these ranks pick up the new badge without waiting for a re-evaluation.
        await tx.profile.updateMany({
          where: { current_rank_level: { gte: rangeStart, lte: rangeEnd } },
          data: { current_rank_image: badge.aws_cloud_front_url },
        });

        // 3. Update assignment record on the badge
        await tx.rank_badge_image.update({
          where: { id },
          data: {
            assigned_min_rank: rangeStart,
            assigned_max_rank: rangeEnd,
          },
        });

        return { conflict: null };
      });
    });

    if (!result) throw ToastData.unknown;
    if (result.conflict) {
      const levels = result.conflict.map((r) => `${r.rank_level}`).join(", ");
      const data: RankBadgeAssignResponseData = {
        ok: false,
        conflict: result.conflict,
        description: `등급 ${levels}에 다른 이미지가 할당되어 있습니다.`,
      };
      return { result: true, data };
    }

    await appCache.refreshCache(CacheKey.TradeRanks);

    const data: RankBadgeAssignResponseData = { ok: true };
    return { result: true, data };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
