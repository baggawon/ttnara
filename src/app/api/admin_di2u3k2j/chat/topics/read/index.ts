import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);
    const topics = await handleConnect((prisma) =>
      prisma.chat_topic.findMany({
        orderBy: [{ display_order: "asc" }, { id: "asc" }],
      })
    );
    return { result: true, data: topics ?? [] };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
