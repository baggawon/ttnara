import "server-only";
import { handleConnect } from "@/helpers/server/prisma";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";

// Confirms the proposed thumbnail belongs to this author and is either an
// orphan (so the caller can request it be attached) or already attached to
// this thread. Returns the id when usable, else null.
export const validateProposedThumbnail = async (
  authorId: string,
  threadId: number,
  proposedId: number | null | undefined
): Promise<number | null> => {
  if (proposedId == null) return null;
  const row = await handleConnect((prisma) =>
    prisma.media_upload.findFirst({
      where: {
        id: proposedId,
        author_id: authorId,
        media_type: "image",
        OR: [
          { attached_to_id: null },
          { attached_to_type: "thread", attached_to_id: threadId },
        ],
      },
      select: { id: true },
    })
  );
  return row ? row.id : null;
};

// Resolves the final thumbnail id *after* attachMediaToContent has run. The
// proposed id must now be attached to this thread for it to be usable.
export const resolveThumbnailMediaId = async (
  threadId: number,
  proposedId: number | null | undefined
): Promise<number | null> => {
  if (proposedId == null) return null;
  const attached = await handleConnect((prisma) =>
    prisma.media_upload.findFirst({
      where: {
        id: proposedId,
        attached_to_type: "thread",
        attached_to_id: threadId,
        media_type: "image",
      },
      select: { id: true },
    })
  );
  return attached ? attached.id : null;
};

// Deletes the user's still-orphan media_uploads matching the client-declared
// unused list. Scoped to the author to prevent cross-user deletion, and to
// attached_to_id IS NULL so any row that got attached during this save (via
// content or thumbnail keep) is preserved.
export const deleteUnusedOrphans = async (
  authorId: string,
  unusedIds: number[] | undefined
): Promise<void> => {
  if (!unusedIds || unusedIds.length === 0) return;
  const rows = await handleConnect((prisma) =>
    prisma.media_upload.findMany({
      where: {
        id: { in: unusedIds },
        author_id: authorId,
        attached_to_id: null,
      },
      select: { id: true, aws_cloud_front_url: true },
    })
  );
  if (!rows || rows.length === 0) return;

  await deleteMultipleFilesFromS3(
    rows.map(
      (r) => `https://${r.aws_cloud_front_url.replace(/^https?:\/\//, "")}`
    )
  );
  await handleConnect((prisma) =>
    prisma.media_upload.deleteMany({
      where: { id: { in: rows.map((r) => r.id) } },
    })
  );
};
