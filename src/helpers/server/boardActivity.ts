import { handleConnect } from "@/helpers/server/prisma";
import { Prisma } from "@prisma/client";
import type { BoardActivityAction } from "@/helpers/boardActivity";

export interface ActivityArgs {
  uid: string;
  action: BoardActivityAction | string;
  topic_id?: number | null;
  thread_id?: number | null;
  comment_id?: number | null;
  note?: string | null;
}

const buildData = (args: ActivityArgs) => ({
  uid: args.uid,
  action: args.action,
  topic_id: args.topic_id ?? null,
  thread_id: args.thread_id ?? null,
  comment_id: args.comment_id ?? null,
  note: args.note ?? null,
});

export async function recordActivity(args: ActivityArgs): Promise<void> {
  await handleConnect((prisma) =>
    prisma.board_activity.create({ data: buildData(args) })
  );
}

export async function recordActivityTx(
  tx: Prisma.TransactionClient,
  args: ActivityArgs
): Promise<void> {
  await tx.board_activity.create({ data: buildData(args) });
}

export async function hasReadActivity(args: {
  uid: string;
  thread_id: number;
}): Promise<boolean> {
  const row = await handleConnect((prisma) =>
    prisma.board_activity.findFirst({
      where: {
        uid: args.uid,
        thread_id: args.thread_id,
        action: "post_read",
      },
      select: { id: true },
    })
  );
  return !!row;
}
