import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { user_setting } from "@prisma/client";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface userUpdateProps extends user_setting {}

export const POST = async (json: userUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json?.id === 0) throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const updateResult = await handleConnect((prisma) =>
      prisma.user_setting.update({
        where: {
          id: json.id,
        },
        data: {
          ...json,
        },
      })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.UserSettings);
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
