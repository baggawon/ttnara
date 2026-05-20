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
    const { id, ...data } = json;
    const updateResult = await handleConnect((prisma) =>
      prisma.tether_setting.update({
        where: { id },
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
