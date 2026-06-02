import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface P2pPauseProps {
  paused: boolean;
}

export const POST = async (json: P2pPauseProps) => {
  try {
    if (typeof json?.paused !== "boolean") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const setting = await handleConnect((prisma) =>
      prisma.general_setting.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      })
    );
    if (!setting) throw ToastData.unknown;

    const updated = await handleConnect((prisma) =>
      prisma.general_setting.update({
        where: { id: setting.id },
        data: { p2p_paused: json.paused } as any,
      })
    );
    if (!updated) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.GeneralSettings);

    return {
      result: true,
      data: { paused: json.paused },
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
