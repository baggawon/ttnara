import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { board_rank } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

// Create a new type that omits auto-generated fields
export type BoardRankCreateProps = Omit<
  board_rank,
  "id" | "created_at" | "updated_at"
>;

export const POST = async (json: BoardRankCreateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const createResult = await handleConnect((prisma) =>
      prisma.board_rank.create({
        data: json,
      })
    );
    if (!createResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.BoardRanks);

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
