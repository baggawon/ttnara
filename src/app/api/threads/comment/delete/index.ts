import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { refundCommentAuthor } from "@/helpers/server/pointService";
import { recordActivity } from "@/helpers/server/boardActivity";
import { BoardActivityAction } from "@/helpers/boardActivity";

export interface commentDeleteProps {
  deleteCommentId: number;
}

export const POST = async (json: commentDeleteProps) => {
  try {
    if (typeof json?.deleteCommentId !== "number") throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const commentMeta = await handleConnect((prisma) =>
      prisma.comment.findUnique({
        where: { id: json.deleteCommentId, author_id: uid! },
        select: {
          id: true,
          author_id: true,
          thread_id: true,
          created_at: true,
        },
      })
    );

    const deleteResult = await handleConnect((prisma) =>
      prisma.comment.delete({
        where: {
          id: json.deleteCommentId,
          author_id: uid!,
        },
      })
    );
    if (!deleteResult) throw ToastData.unknown;

    if (commentMeta && commentMeta.created_at) {
      await refundCommentAuthor({
        comment_id: commentMeta.id,
        author_uid: commentMeta.author_id,
        created_at: commentMeta.created_at,
        thread_id: commentMeta.thread_id,
      });
    }

    if (commentMeta && uid) {
      await recordActivity({
        uid,
        action: BoardActivityAction.comment_delete,
        thread_id: commentMeta.thread_id,
        comment_id: commentMeta.id,
      });
    }

    return {
      result: true,
      message: ToastData.commentDelete,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
