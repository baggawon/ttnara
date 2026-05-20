import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);
    const items = await handleConnect((prisma) =>
      prisma.chat_fixed_message.findMany({
        orderBy: [{ topic_id: "asc" }, { id: "asc" }],
      })
    );
    return { result: true, data: items ?? [] };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
