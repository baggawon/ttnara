import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";

export interface ThreadGenaralSettingsReadProps {}

export const GET = async (queryParams: ThreadGenaralSettingsReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const threadGeneralSettings = await handleConnect((prisma) =>
      prisma.thread_setting.findFirst()
    );

    if (!threadGeneralSettings) throw ToastData.unknown;

    return {
      result: true,
      data: threadGeneralSettings,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
