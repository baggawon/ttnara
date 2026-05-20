import {
  threadDetailInclude,
  type ThreadWithProfile,
} from "@/app/api/threads/read";

import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { ToastData } from "@/helpers/toastData";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { signCloudFrontUrlsInHtml } from "@/helpers/server/s3";
import { applyTopicPoints, getBalance } from "@/helpers/server/pointService";
import { PointAction } from "@/helpers/pointSystem";
import {
  hasReadActivity,
  recordActivity,
} from "@/helpers/server/boardActivity";
import { BoardActivityAction } from "@/helpers/boardActivity";

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
        include: threadDetailInclude,
      })
    );

    if (!thread) {
      throw new Error("Thread not found");
    }

    if (thread.topic_id !== topic.id) {
      throw new Error("Thread does not belong to this topic");
    }

    // Get session for access control and point awarding
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const isAdmin = session?.user?.is_app_admin ?? false;

    // use_mypostonly: 익명 글은 작성자 본인과 관리자만 열람 가능
    if (topic.use_mypostonly && thread.is_secret) {
      if (!isAdmin && userId !== thread.author_id) {
        throw new Error("본인의 글만 열람할 수 있습니다.");
      }
    }

    // Read points and activity log fire once per (user, thread). Self-reads
    // are excluded. Subsequent reads only increment the view counter.
    const readAmount = topic.points_per_post_read ?? 0;
    const isFirstReadCandidate = !!userId && userId !== thread.author_id;
    const alreadyRead = isFirstReadCandidate
      ? await hasReadActivity({ uid: userId, thread_id: thread.id })
      : true;

    if (isFirstReadCandidate && !alreadyRead && readAmount < 0) {
      const balance = await getBalance(userId);
      if (balance < Math.abs(readAmount)) {
        throw ToastData.insufficientPoints;
      }
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

    // First-read effects: charge/award points and log activity exactly once.
    if (isFirstReadCandidate && !alreadyRead) {
      if (readAmount !== 0) {
        const apply = await handleConnect((prisma) =>
          prisma.$transaction((tx) =>
            applyTopicPoints(tx, {
              uid: userId,
              amount: readAmount,
              action: PointAction.post_read,
              topic_id: topic.id,
              thread_id: thread.id,
            })
          )
        );
        if (!apply?.ok) {
          throw ToastData.insufficientPoints;
        }
      }
      await recordActivity({
        uid: userId,
        action: BoardActivityAction.post_read,
        topic_id: topic.id,
        thread_id: thread.id,
      });
    }

    if (thread.content) {
      thread.content = signCloudFrontUrlsInHtml(thread.content);
    }

    return { ...thread, images: [] };
  } catch (error) {
    if (typeof error === "string") throw error;
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
