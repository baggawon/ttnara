import {
  paginationManager,
  requestValidator,
  RequestValidator,
} from "@/helpers/server/serverFunctions";
import { Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface BoardActivityItem {
  id: number;
  action: string;
  topic_id: number | null;
  topic_url: string | null;
  topic_name: string | null;
  thread_id: number | null;
  thread_title: string | null;
  comment_id: number | null;
  comment_snippet: string | null;
  note: string | null;
  created_at: Date;
}

export interface BoardActivityResponse {
  items: BoardActivityItem[];
  pagination: PaginationInfo;
}

export interface BoardActivityReadProps {
  page?: number;
  pageSize?: number;
  action?: string | "all";
}

const COMMENT_SNIPPET_LENGTH = 80;

const stripToText = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const text = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  return text.length > COMMENT_SNIPPET_LENGTH
    ? `${text.slice(0, COMMENT_SNIPPET_LENGTH)}…`
    : text;
};

export const GET = async (queryParams: BoardActivityReadProps) => {
  try {
    const { uid } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );
    if (!uid) throw ToastData.noAuth;

    const manager = paginationManager({
      page: queryParams.page ?? 1,
      pageSize: queryParams.pageSize ?? 20,
    } as any);

    const where: Prisma.board_activityWhereInput = { uid };
    if (queryParams.action && queryParams.action !== "all") {
      where.action = queryParams.action;
    }

    const { page, pageSize } = manager.getPageInfo();

    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.board_activity.count({ where }),
        prisma.board_activity.findMany({
          where,
          orderBy: { created_at: Prisma.SortOrder.desc },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
    );
    if (!result) throw ToastData.unknown;

    const [totalCount, rows] = result;
    manager.setTotalCount(totalCount);

    const topicIds = Array.from(
      new Set(
        rows
          .map((r) => r.topic_id)
          .filter((v): v is number => typeof v === "number")
      )
    );
    const threadIds = Array.from(
      new Set(
        rows
          .map((r) => r.thread_id)
          .filter((v): v is number => typeof v === "number")
      )
    );
    const commentIds = Array.from(
      new Set(
        rows
          .map((r) => r.comment_id)
          .filter((v): v is number => typeof v === "number")
      )
    );

    const joined = await handleConnect((prisma) =>
      Promise.all([
        topicIds.length
          ? prisma.topic.findMany({
              where: { id: { in: topicIds } },
              select: { id: true, url: true, name: true },
            })
          : Promise.resolve([] as { id: number; url: string; name: string }[]),
        threadIds.length
          ? prisma.thread.findMany({
              where: { id: { in: threadIds } },
              select: { id: true, title: true, topic_id: true },
            })
          : Promise.resolve(
              [] as { id: number; title: string; topic_id: number }[]
            ),
        commentIds.length
          ? prisma.comment.findMany({
              where: { id: { in: commentIds } },
              select: { id: true, content: true, thread_id: true },
            })
          : Promise.resolve(
              [] as { id: number; content: string; thread_id: number }[]
            ),
      ])
    );
    const [topics, threads, comments] = joined ?? [[], [], []];

    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const threadMap = new Map(threads.map((t) => [t.id, t]));
    const commentMap = new Map(comments.map((c) => [c.id, c]));

    const items: BoardActivityItem[] = rows.map((row) => {
      // Threads carry topic_id even when the activity row doesn't (e.g.
      // comment_delete looked up via comment), so fall back through the join.
      const thread =
        row.thread_id != null ? threadMap.get(row.thread_id) : undefined;
      const resolvedTopicId = row.topic_id ?? thread?.topic_id ?? null;
      const topic =
        resolvedTopicId != null ? topicMap.get(resolvedTopicId) : undefined;
      const comment =
        row.comment_id != null ? commentMap.get(row.comment_id) : undefined;

      return {
        id: row.id,
        action: row.action,
        topic_id: resolvedTopicId,
        topic_url: topic?.url ?? null,
        topic_name: topic?.name ?? null,
        thread_id: row.thread_id,
        thread_title: thread?.title ?? null,
        comment_id: row.comment_id,
        comment_snippet: stripToText(comment?.content),
        note: row.note,
        created_at: row.created_at,
      };
    });

    const response: BoardActivityResponse = {
      items,
      pagination: manager.getPagination(),
    };

    return { result: true, data: response };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
