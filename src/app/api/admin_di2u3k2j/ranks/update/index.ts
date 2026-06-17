import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { trade_rank } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { reevaluateAllUserRanks } from "@/helpers/server/rankEvaluator";

export interface RanksUpdateProps extends trade_rank {}

export const POST = async (json: RanksUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    // badge_image is managed exclusively via /rank_badges/* endpoints to keep
    // storage values (unsigned) consistent. Strip it so admin form
    // roundtripping (which receives signed URLs) doesn't overwrite storage.
    const { badge_image: _omitBadge, ...rest } = json;
    void _omitBadge;

    // Editing a tier's name/threshold changes which tier users fall into and
    // what name they display, so re-derive every profile snapshot atomically.
    const updateResult = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        const updated = await tx.trade_rank.update({
          where: { id: json.id },
          data: rest,
        });
        await reevaluateAllUserRanks(tx);
        return updated;
      })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.TradeRanks);

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
