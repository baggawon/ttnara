import {
  RequestValidator,
  requestValidator,
  paginationManager,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export interface ChatReportsProps {
  page?: number;
  pageSize?: number;
}

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);
    const manager = paginationManager(queryParams);
    const { page, pageSize } = manager.getPageInfo();

    const [count, reports] = (await handleConnect((prisma) =>
      Promise.all([
        prisma.chat_report.count(),
        prisma.chat_report.findMany({
          orderBy: { created_at: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
    )) ?? [0, []];

    manager.setTotalCount(count);

    // Hydrate the reported message and reporter displayname for each row.
    const messageIds = Array.from(new Set(reports.map((r) => r.message_id)));
    const reporterIds = Array.from(new Set(reports.map((r) => r.reporter_id)));

    const [messages, profiles] = await Promise.all([
      handleConnect((prisma) =>
        prisma.chat_message.findMany({
          where: { id: { in: messageIds } },
          select: {
            id: true,
            content: true,
            uid: true,
            displayname: true,
            topic_id: true,
            is_hidden: true,
          },
        })
      ),
      handleConnect((prisma) =>
        prisma.profile.findMany({
          where: { uid: { in: reporterIds } },
          select: { uid: true, displayname: true },
        })
      ),
    ]);

    const msgById = new Map((messages ?? []).map((m) => [m.id, m]));
    const reporterById = new Map(
      (profiles ?? []).map((p) => [p.uid, p.displayname])
    );

    const data = reports.map((r) => ({
      ...r,
      message: msgById.get(r.message_id) ?? null,
      reporter_displayname: reporterById.get(r.reporter_id) ?? null,
    }));

    return {
      result: true,
      data: { reports: data, pagination: manager.getPagination() },
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
