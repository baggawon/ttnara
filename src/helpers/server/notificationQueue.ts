import { handleConnect } from "@/helpers/server/prisma";
import {
  makeMessagePayload,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { AlarmTypes } from "@/helpers/types";

const DEBOUNCE_MINUTES = 5;
const MAX_DELAY_MINUTES = 30;

export const enqueueCommentNotification = async ({
  commenter_id,
  thread_id,
  topic_url,
  topic_id,
}: {
  commenter_id: string;
  thread_id: number;
  topic_url: string;
  topic_id: number;
}) => {
  // Get thread author
  const thread = await handleConnect((prisma) =>
    prisma.thread.findUnique({
      where: { id: thread_id },
      select: { author_id: true },
    })
  );
  if (!thread || thread.author_id === commenter_id) return;

  // Get commenter displayname
  const commenterProfile = await handleConnect((prisma) =>
    prisma.profile.findUnique({
      where: { uid: commenter_id },
      select: { displayname: true },
    })
  );
  if (!commenterProfile) return;

  const now = new Date();
  const dispatchAfter = new Date(now.getTime() + DEBOUNCE_MINUTES * 60 * 1000);

  // Try to find existing pending entry
  const existing = await handleConnect((prisma) =>
    prisma.notification_queue.findUnique({
      where: {
        user_id_thread_id_dispatched: {
          user_id: thread.author_id,
          thread_id,
          dispatched: false,
        },
      },
    })
  );

  if (existing) {
    // Cap the sliding window at MAX_DELAY_MINUTES from original creation
    const maxDispatch = new Date(
      existing.created_at.getTime() + MAX_DELAY_MINUTES * 60 * 1000
    );
    const cappedDispatch =
      dispatchAfter < maxDispatch ? dispatchAfter : maxDispatch;

    await handleConnect((prisma) =>
      prisma.notification_queue.update({
        where: { id: existing.id },
        data: {
          count: existing.count + 1,
          last_commenter: commenterProfile.displayname,
          dispatch_after: cappedDispatch,
        },
      })
    );
  } else {
    await handleConnect((prisma) =>
      prisma.notification_queue.create({
        data: {
          user_id: thread.author_id,
          thread_id,
          topic_id,
          topic_url,
          count: 1,
          last_commenter: commenterProfile.displayname,
          dispatched: false,
          dispatch_after: dispatchAfter,
        },
      })
    );
  }

  // Dispatch any overdue items (no cron needed)
  dispatchPendingNotifications().catch(() => {});
};

export const dispatchPendingNotifications = async () => {
  const now = new Date();

  const pendingItems = await handleConnect((prisma) =>
    prisma.notification_queue.findMany({
      where: {
        dispatched: false,
        dispatch_after: { lte: now },
      },
    })
  );

  if (!pendingItems || pendingItems.length === 0) return { dispatched: 0 };

  let dispatched = 0;

  for (const item of pendingItems) {
    const user = await handleConnect((prisma) =>
      prisma.user.findUnique({
        where: { id: item.user_id },
        select: webPushUserSelect,
      })
    );

    if (user) {
      const body =
        item.count === 1
          ? `${item.last_commenter}님이 댓글을 남겼습니다`
          : `${item.last_commenter}님 외 ${item.count - 1}명이 댓글을 남겼습니다`;

      const payload = makeMessagePayload({
        body,
        type: AlarmTypes.BoardComment,
        user,
        topic_url: item.topic_url,
        thread_id: item.thread_id,
      });

      await sendWebpush([payload], [user]);
    }

    await handleConnect((prisma) =>
      prisma.notification_queue.update({
        where: { id: item.id },
        data: { dispatched: true },
      })
    );

    dispatched++;
  }

  return { dispatched };
};
