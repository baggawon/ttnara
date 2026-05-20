import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { forEach } from "@/helpers/basic";

export interface BoardPreviewThread {
  id: number;
  title: string;
  created_at: Date;
  views: number;
  is_notice: boolean;
  comment_count: number;
  displayname: string;
  is_app_admin: boolean;
  auth_level: number;
}

export interface BoardPreviewTopic {
  id: number;
  name: string;
  url: string;
  level_moderator: number;
  threads: BoardPreviewThread[];
}

export interface BoardPreviewResponse {
  topics: BoardPreviewTopic[];
}

const PREVIEW_THREAD_COUNT = 10;
const MAX_PREVIEW_TOPICS = 2;

export const GET = async () => {
  try {
    const topicsCache = appCache.getByKey(CacheKey.Topics) as any;
    if (!topicsCache) {
      return { result: true, data: { topics: [] } };
    }

    // Find active topics with preview_on_homepage enabled
    const previewTopics: {
      id: number;
      name: string;
      url: string;
      display_order: number;
      level_moderator: number;
    }[] = [];
    forEach(Object.values(topicsCache) as any[], (topic: any) => {
      if (topic.preview_on_homepage && topic.is_active) {
        previewTopics.push({
          id: topic.id,
          name: topic.name,
          url: topic.url,
          display_order: topic.display_order,
          level_moderator: topic.level_moderator,
        });
      }
    });

    if (previewTopics.length === 0) {
      return { result: true, data: { topics: [] } };
    }

    // Sort by display_order ASC, then url alphanumeric ASC; limit to 2
    previewTopics.sort((a, b) => {
      if (a.display_order !== b.display_order)
        return a.display_order - b.display_order;
      return a.url.localeCompare(b.url);
    });
    const limitedTopics = previewTopics.slice(0, MAX_PREVIEW_TOPICS);

    // Fetch recent threads for preview topics
    const results = await Promise.all(
      limitedTopics.map(async (topic) => {
        const threads = await handleConnect((prisma) =>
          prisma.thread.findMany({
            where: {
              topic_id: topic.id,
              is_blocked: false,
              is_secret: false,
            },
            orderBy: [{ is_notice: "desc" }, { created_at: "desc" }],
            take: PREVIEW_THREAD_COUNT,
            select: {
              id: true,
              title: true,
              created_at: true,
              views: true,
              is_notice: true,
              _count: { select: { comments: true } },
              author: {
                select: {
                  profile: {
                    select: {
                      displayname: true,
                      is_app_admin: true,
                      auth_level: true,
                    },
                  },
                },
              },
            },
          })
        );

        return {
          id: topic.id,
          name: topic.name,
          url: topic.url,
          level_moderator: topic.level_moderator,
          threads: (threads ?? []).map((t: any) => ({
            id: t.id,
            title: t.title,
            created_at: t.created_at,
            views: t.views,
            is_notice: t.is_notice,
            comment_count: t._count?.comments ?? 0,
            displayname: t.author?.profile?.displayname ?? "",
            is_app_admin: t.author?.profile?.is_app_admin ?? false,
            auth_level: t.author?.profile?.auth_level ?? 0,
          })),
        };
      })
    );

    return {
      result: true,
      data: { topics: results } as BoardPreviewResponse,
    };
  } catch (error) {
    console.error("Board preview read error:", error);
    return { result: false, message: String(error) };
  }
};
