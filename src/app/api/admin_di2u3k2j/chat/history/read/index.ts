import {
  RequestValidator,
  requestValidator,
  paginationManager,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export interface ChatHistoryReadProps {
  topic_id?: number;
  uid?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ChatHistoryRow {
  id: string;
  topic_id: number;
  uid: string;
  displayname: string;
  rank_level: number;
  rank_image: string | null;
  content: string;
  is_hidden: boolean;
  hidden_by_id: string | null;
  hidden_at: string | null;
  created_at: string;
  /** Mute / spam-penalty events that targeted this user within ±5 min of the message. */
  mod_events: Array<{
    id: number;
    action: string;
    by_admin_id: string | null;
    reason: string | null;
    metadata: any;
    created_at: string;
  }>;
}

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const manager = paginationManager(queryParams);
    const { page, pageSize } = manager.getPageInfo();

    const where: any = {};
    if (queryParams.topic_id) {
      where.topic_id = Number(queryParams.topic_id);
    }
    if (queryParams.uid) {
      where.uid = String(queryParams.uid);
    }
    if (queryParams.search && String(queryParams.search).trim()) {
      where.content = {
        contains: String(queryParams.search).trim(),
        mode: "insensitive",
      };
    }

    const [count, messages] = (await handleConnect((prisma) =>
      Promise.all([
        prisma.chat_message.count({ where }),
        prisma.chat_message.findMany({
          where,
          orderBy: { created_at: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
    )) ?? [0, []];

    manager.setTotalCount(count);

    // Pull mod log events that target any uid in this page so we can annotate
    // each row. Window the join by ±5 min around the message timestamp.
    const uids = Array.from(new Set(messages.map((m) => m.uid)));
    const messageIds = messages.map((m) => m.id);

    const earliest = messages.length
      ? new Date(Math.min(...messages.map((m) => m.created_at.getTime())))
      : null;
    const latest = messages.length
      ? new Date(Math.max(...messages.map((m) => m.created_at.getTime())))
      : null;

    const modLogs = uids.length
      ? ((await handleConnect((prisma) =>
          prisma.chat_moderation_log.findMany({
            where: {
              OR: [
                { target_uid: { in: uids } },
                { target_message_id: { in: messageIds } },
              ],
              ...(earliest && latest
                ? {
                    created_at: {
                      gte: new Date(earliest.getTime() - 5 * 60_000),
                      lte: new Date(latest.getTime() + 5 * 60_000),
                    },
                  }
                : {}),
            },
            orderBy: { created_at: "asc" },
          })
        )) ?? [])
      : [];

    const rows: ChatHistoryRow[] = messages.map((m) => {
      const events = modLogs.filter((log) => {
        if (log.target_message_id === m.id) return true;
        if (log.target_uid !== m.uid) return false;
        const dt = Math.abs(log.created_at.getTime() - m.created_at.getTime());
        return dt <= 5 * 60_000;
      });
      return {
        id: m.id,
        topic_id: m.topic_id,
        uid: m.uid,
        displayname: m.displayname,
        rank_level: m.rank_level,
        rank_image: m.rank_image,
        content: m.content,
        is_hidden: m.is_hidden,
        hidden_by_id: m.hidden_by_id,
        hidden_at: m.hidden_at?.toISOString() ?? null,
        created_at: m.created_at.toISOString(),
        mod_events: events.map((e) => ({
          id: e.id,
          action: e.action,
          by_admin_id: e.by_admin_id,
          reason: e.reason,
          metadata: e.metadata,
          created_at: e.created_at.toISOString(),
        })),
      };
    });

    return {
      result: true,
      data: { messages: rows, pagination: manager.getPagination() },
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
