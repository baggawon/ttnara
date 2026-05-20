import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export interface TopicStat {
  topic_id: number;
  message_count: number;
  hidden_count: number;
  last_message_at: string | null;
  unique_authors: number;
}

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    // Pull aggregate counts and last-message timestamp in one shot via Prisma
    // groupBy. Hidden count is a separate groupBy because Prisma's groupBy
    // doesn't combine count(*) with count(filter).
    const data = await handleConnect(async (prisma) => {
      const grouped = await prisma.chat_message.groupBy({
        by: ["topic_id"],
        _count: { _all: true },
        _max: { created_at: true },
      });

      const hidden = await prisma.chat_message.groupBy({
        by: ["topic_id"],
        where: { is_hidden: true },
        _count: { _all: true },
      });
      const hiddenByTopic = new Map(
        hidden.map((h) => [h.topic_id, h._count._all])
      );

      // unique authors — separate query, dedupe in JS
      const uniqRows = await prisma.chat_message.findMany({
        select: { topic_id: true, uid: true },
        distinct: ["topic_id", "uid"],
      });
      const authorsByTopic = new Map<number, number>();
      for (const r of uniqRows) {
        authorsByTopic.set(
          r.topic_id,
          (authorsByTopic.get(r.topic_id) ?? 0) + 1
        );
      }

      const stats: TopicStat[] = grouped.map((g) => ({
        topic_id: g.topic_id,
        message_count: g._count._all,
        hidden_count: hiddenByTopic.get(g.topic_id) ?? 0,
        last_message_at: g._max.created_at?.toISOString() ?? null,
        unique_authors: authorsByTopic.get(g.topic_id) ?? 0,
      }));

      return stats;
    });

    return { result: true, data: data ?? [] };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
