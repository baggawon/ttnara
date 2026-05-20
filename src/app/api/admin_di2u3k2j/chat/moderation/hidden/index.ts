import {
  RequestValidator,
  requestValidator,
  paginationManager,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export interface ChatHiddenMessagesProps {
  page?: number;
  pageSize?: number;
}

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);
    const manager = paginationManager(queryParams);
    const { page, pageSize } = manager.getPageInfo();

    const where = { is_hidden: true };

    const [count, rows] = (await handleConnect((prisma) =>
      Promise.all([
        prisma.chat_message.count({ where }),
        prisma.chat_message.findMany({
          where,
          orderBy: { hidden_at: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
    )) ?? [0, []];

    manager.setTotalCount(count);
    return {
      result: true,
      data: { messages: rows, pagination: manager.getPagination() },
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
