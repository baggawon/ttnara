import { threadInclude, type ThreadWithProfile } from "@/app/api/threads/read";

import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { ToastData } from "@/helpers/toastData";

export interface ThreadReadProps {
  topic_url: string;
  thread_id: number;
}

async function getThread(
  queryParams: ThreadReadProps
): Promise<ThreadWithProfile> {
  const { topic_url, thread_id } = queryParams;

  try {
    const topics = appCache.getByKey(CacheKey.Topics) as any;

    // First check if topic exists
    const topic = topics[topic_url];

    if (!topic) {
      throw new Error("Topic not found");
    }

    // Get thread with all its relations
    const thread = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: {
          id: thread_id,
          topic: {
            url: topic_url,
          },
        },
        include: threadInclude,
      })
    );

    if (!thread) {
      throw new Error("Thread not found");
    }

    if (thread.topic_id !== topic.id) {
      throw new Error("Thread does not belong to this topic");
    }

    // Increment view count
    await handleConnect((prisma) =>
      prisma.thread.update({
        where: {
          id: thread_id,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      })
    );

    return thread;
  } catch (error) {
    throw ToastData.unknown;
  }
}

export async function GET(queryParams: any) {
  try {
    const response = await getThread(queryParams as ThreadReadProps);
    return {
      result: true,
      data: response,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
}
