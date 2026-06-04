import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface BoardRanksDeleteProps {
  deleteRankId: number;
}

export const POST = async (json: BoardRanksDeleteProps) => {
  try {
    if (typeof json?.deleteRankId !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    // board_rank has no FK relations — it's referenced only by the denormalized
    // profile.current_board_rank_* snapshot. A bare delete therefore leaves
    // every user sitting on the deleted rank with a stale name/badge until their
    // next board-point change re-runs the evaluator. Delete + re-evaluate those
    // users atomically.
    const deleteResult = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        const rank = await tx.board_rank.findUnique({
          where: { id: json.deleteRankId },
          select: { rank_level: true },
        });
        if (!rank) return null;

        await tx.board_rank.delete({ where: { id: json.deleteRankId } });

        // Only users whose snapshot points at the deleted level can be stale;
        // other levels' evaluations are unchanged by removing this rank.
        const affected = await tx.profile.findMany({
          where: { current_board_rank_level: rank.rank_level },
          select: { uid: true, point: true },
        });

        if (affected.length > 0) {
          // Load the remaining ranks once (mirrors the board-rank evaluator's
          // pick: highest rank whose min_point the user still meets).
          const ranks = await tx.board_rank.findMany({
            where: { is_active: true },
            orderBy: { min_point: "asc" },
          });
          const pick = (point: number) => {
            let match: (typeof ranks)[number] | null = null;
            for (const r of ranks) {
              if (point >= r.min_point) match = r;
              else break;
            }
            return match;
          };

          for (const p of affected) {
            const m = pick(p.point ?? 0);
            await tx.profile.update({
              where: { uid: p.uid },
              data: {
                current_board_rank_level: m?.rank_level ?? 1,
                current_board_rank_name: m?.name ?? null,
                current_board_rank_image: m?.badge_image ?? null,
              },
            });
          }
        }

        return { id: json.deleteRankId };
      })
    );
    if (!deleteResult) throw ToastData.unknown;

    return {
      result: true,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
