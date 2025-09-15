import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";

export interface GeneralReadProps {}

export const GET = async (queryParams: GeneralReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const generalSettings = await handleConnect((prisma) =>
      prisma.general_setting.findFirst()
    );

    if (!generalSettings) throw ToastData.unknown;

    return {
      result: true,
      data: generalSettings,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
