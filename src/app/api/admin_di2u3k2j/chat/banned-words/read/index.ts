import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);
    const words = await handleConnect((prisma) =>
      prisma.chat_banned_word.findMany({ orderBy: { id: "asc" } })
    );
    return { result: true, data: words ?? [] };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
