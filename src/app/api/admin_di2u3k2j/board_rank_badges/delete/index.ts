import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { deleteFileFromS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface BoardRankBadgeDeleteProps {
  id: number;
}

export const POST = async (json: BoardRankBadgeDeleteProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const id = Number(json.id);
    if (!Number.isFinite(id) || id <= 0) throw ToastData.unknown;

    const badge = await handleConnect(async (prisma) => {
      return await prisma.$transaction(async (tx) => {
        const row = await tx.board_rank_badge_image.findUnique({
          where: { id },
        });
        if (!row) return null;

        await tx.board_rank.updateMany({
          where: { badge_image: row.aws_cloud_front_url },
          data: { badge_image: null },
        });

        // Clear the denormalized profile snapshot too; otherwise users keep
        // pointing at the just-deleted S3 object and render a broken image.
        await tx.profile.updateMany({
          where: { current_board_rank_image: row.aws_cloud_front_url },
          data: { current_board_rank_image: null },
        });

        await tx.board_rank_badge_image.delete({ where: { id } });
        return row;
      });
    });

    if (!badge) throw ToastData.unknown;

    try {
      await deleteFileFromS3(badge.aws_url);
    } catch (deleteError) {
      console.error("board rank badge S3 deletion error:", deleteError);
    }

    await appCache.refreshCache(CacheKey.BoardRanks);
    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
