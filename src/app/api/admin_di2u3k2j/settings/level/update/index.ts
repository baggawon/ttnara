import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { level_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface levelUpdateProps extends level_setting {}

export const POST = async (json: levelUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json?.id === 0) throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);
    const { id: _ignoredId, ...data } = json;

    // Singleton row with no DB-enforced uniqueness: always write the canonical
    // (lowest-id) row so the write hits the same row every reader returns (all
    // reads use `orderBy: { id: "asc" }`), otherwise the saved value can appear
    // to "revert" when an unordered findFirst() later returns a duplicate row.
    const canonical = await handleConnect((prisma) =>
      prisma.level_setting.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      })
    );
    if (!canonical) throw ToastData.unknown;

    const updateResult = await handleConnect((prisma) =>
      prisma.level_setting.update({
        where: {
          id: canonical.id,
        },
        data,
      })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.LevelSettings);
    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
