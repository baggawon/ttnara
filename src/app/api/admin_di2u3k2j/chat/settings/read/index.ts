import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    let settings = await handleConnect((prisma) =>
      prisma.chat_setting.findFirst({
        orderBy: { id: "asc" },
      })
    );

    if (!settings) {
      // First-run: create the singleton with defaults so the admin UI has a
      // row to edit.
      settings = await handleConnect((prisma) =>
        prisma.chat_setting.create({ data: {} })
      );
    }

    return { result: true, data: settings };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
