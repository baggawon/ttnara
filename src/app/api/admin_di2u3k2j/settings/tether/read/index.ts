import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";

export interface TetherSettingsReadProps {}

export const GET = async (queryParams: TetherSettingsReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    let tetherSettings = await handleConnect((prisma) =>
      prisma.tether_setting.findFirst({ orderBy: { id: "asc" } })
    );

    if (!tetherSettings) {
      await handleConnect((prisma) => prisma.tether_setting.create({}));
      tetherSettings = await handleConnect((prisma) =>
        prisma.tether_setting.findFirst({ orderBy: { id: "asc" } })
      );
    }

    if (!tetherSettings) throw ToastData.unknown;

    return {
      result: true,
      data: tetherSettings,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
