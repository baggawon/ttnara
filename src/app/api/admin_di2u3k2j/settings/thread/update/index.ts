import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { thread_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
// import { removeColumnsFromObject } from "@/helpers/basic";

export interface threadGeneralSettingsUpdateProps extends thread_setting {}

export const POST = async (json: threadGeneralSettingsUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json?.id === 0) throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);
    const { id, ...data } = json;
    const updateResult = await handleConnect((prisma) =>
      prisma.thread_setting.update({
        where: {
          id,
        },
        data,
      })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.ThreadGeneralSettings);
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
