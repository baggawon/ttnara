import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { trade_rank } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface RanksUpdateProps extends trade_rank {}

export const POST = async (json: RanksUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    // badge_image is managed exclusively via /rank_badges/* endpoints to keep
    // storage values (unsigned) consistent. Strip it so admin form
    // roundtripping (which receives signed URLs) doesn't overwrite storage.
    const { badge_image: _omitBadge, ...rest } = json;
    void _omitBadge;

    const updateResult = await handleConnect((prisma) =>
      prisma.trade_rank.update({
        where: { id: json.id },
        data: rest,
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
