import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { tether_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { revalidatePath } from "next/cache";

export interface TetherSettingsUpdateProps extends tether_setting {}

export const POST = async (json: TetherSettingsUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json?.id === 0) throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);
    const { id: _ignoredId, ...data } = json;

    // The settings row is a singleton, but no DB constraint enforces that and a
    // historic check-then-create race may have left duplicate rows. Always write
    // the canonical (lowest-id) row so the write hits the same row every reader
    // returns (all reads use `orderBy: { id: "asc" }`). Otherwise an unordered
    // findFirst() could return a different row after the update and the admin UI
    // would appear to "revert" the saved value.
    const canonical = await handleConnect((prisma) =>
      prisma.tether_setting.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      })
    );
    if (!canonical) throw ToastData.unknown;

    const updateResult = await handleConnect((prisma) =>
      prisma.tether_setting.update({
        where: { id: canonical.id },
        data,
      })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.TetherSettings);
    revalidatePath("/", "layout");
    return { result: true };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
