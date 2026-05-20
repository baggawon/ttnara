import { handleConnect } from "@/helpers/server/prisma";

export type MediaAttachToType =
  | "thread"
  | "tether"
  | "comment"
  | "dev_notice"
  | "popup";

interface AttachArgs {
  authorId: string;
  content: string;
  attachedToType: MediaAttachToType;
  attachedToId: number;
  isEdit: boolean;
  extraKeepIds?: number[];
}

export const attachMediaToContent = async ({
  authorId,
  content,
  attachedToType,
  attachedToId,
  isEdit,
  extraKeepIds = [],
}: AttachArgs) => {
  const keepSet = new Set(extraKeepIds);

  const orphans = await handleConnect((prisma) =>
    prisma.media_upload.findMany({
      where: { author_id: authorId, attached_to_id: null },
      select: { id: true, aws_cloud_front_url: true },
    })
  );

  const toAttachIds =
    orphans
      ?.filter(
        (row) =>
          content.includes(row.aws_cloud_front_url) || keepSet.has(row.id)
      )
      .map((row) => row.id) ?? [];

  if (toAttachIds.length > 0) {
    await handleConnect((prisma) =>
      prisma.media_upload.updateMany({
        where: { id: { in: toAttachIds } },
        data: {
          attached_to_type: attachedToType,
          attached_to_id: attachedToId,
        },
      })
    );
  }

  if (isEdit) {
    const previouslyAttached = await handleConnect((prisma) =>
      prisma.media_upload.findMany({
        where: {
          attached_to_type: attachedToType,
          attached_to_id: attachedToId,
        },
        select: { id: true, aws_cloud_front_url: true },
      })
    );

    const toDetachIds =
      previouslyAttached
        ?.filter(
          (row) =>
            !content.includes(row.aws_cloud_front_url) && !keepSet.has(row.id)
        )
        .map((row) => row.id) ?? [];

    if (toDetachIds.length > 0) {
      await handleConnect((prisma) =>
        prisma.media_upload.updateMany({
          where: { id: { in: toDetachIds } },
          data: { attached_to_type: null, attached_to_id: null },
        })
      );
    }
  }
};
