import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";

export interface UserReadProps {}

export const GET = async (queryParams: UserReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    let userSettings = await handleConnect((prisma) =>
      prisma.user_setting.findFirst()
    );

    if (userSettings === null) {
      await handleConnect((prisma) => prisma.user_setting.create({}));
      userSettings = await handleConnect((prisma) =>
        prisma.user_setting.findFirst()
      );
    }

    if (!userSettings) throw ToastData.unknown;

    return {
      result: true,
      data: userSettings,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
