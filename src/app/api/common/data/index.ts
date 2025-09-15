import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.User], queryParams);

    const commonData = await handleConnect((prisma) =>
      prisma.common.findMany()
    );
    return {
      result: true,
      message: undefined,
      data: commonData,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
