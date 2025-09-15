import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";

export interface LevelReadProps {}

export const GET = async (queryParams: LevelReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    let levelSettings = await handleConnect((prisma) =>
      prisma.level_setting.findFirst()
    );

    if (levelSettings === null) {
      await handleConnect((prisma) => prisma.level_setting.create({}));
      levelSettings = await handleConnect((prisma) =>
        prisma.level_setting.findFirst()
      );
    }

    if (!levelSettings) throw ToastData.unknown;

    return {
      result: true,
      data: levelSettings,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
