import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const setting = await handleConnect((prisma) =>
      prisma.chat_setting.findFirst({
        orderBy: { id: "asc" },
        include: {
          banned_users: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayname: true } },
            },
          },
        },
      })
    );

    return { result: true, data: setting?.banned_users ?? [] };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
