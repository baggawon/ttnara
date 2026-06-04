import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface BoardRankBadgeUnassignProps {
  id?: number;
  rank_id?: number;
}

export const POST = async (json: BoardRankBadgeUnassignProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const id =
      typeof json.id === "number" && Number.isFinite(json.id) && json.id > 0
        ? json.id
        : null;
    const rankId =
      typeof json.rank_id === "number" &&
      Number.isFinite(json.rank_id) &&
      json.rank_id > 0
        ? json.rank_id
        : null;

    if (id === null && rankId === null) throw ToastData.unknown;

    await handleConnect(async (prisma) => {
      return await prisma.$transaction(async (tx) => {
        let badge = null as Awaited<
          ReturnType<typeof tx.board_rank_badge_image.findUnique>
        > | null;

        if (id !== null) {
          badge = await tx.board_rank_badge_image.findUnique({ where: { id } });
        } else if (rankId !== null) {
          const rank = await tx.board_rank.findUnique({
            where: { id: rankId },
            select: { badge_image: true },
          });
          if (!rank?.badge_image) return; // Nothing assigned — no-op
          badge = await tx.board_rank_badge_image.findFirst({
            where: { aws_cloud_front_url: rank.badge_image },
          });
        }
        if (!badge) throw ToastData.unknown;

        await tx.board_rank.updateMany({
          where: { badge_image: badge.aws_cloud_front_url },
          data: { badge_image: null },
        });

        // Keep the denormalized profile snapshot in sync with the rank config.
        await tx.profile.updateMany({
          where: { current_board_rank_image: badge.aws_cloud_front_url },
          data: { current_board_rank_image: null },
        });

        await tx.board_rank_badge_image.update({
          where: { id: badge.id },
          data: {
            assigned_min_rank: null,
            assigned_max_rank: null,
          },
        });
      });
    });

    await appCache.refreshCache(CacheKey.BoardRanks);
    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
