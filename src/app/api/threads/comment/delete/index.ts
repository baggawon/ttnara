import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface commentDeleteProps {
  deleteCommentId: number;
}

export const POST = async (json: commentDeleteProps) => {
  try {
    if (typeof json?.deleteCommentId !== "number") throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const deleteResult = await handleConnect((prisma) =>
      prisma.comment.delete({
        where: {
          id: json.deleteCommentId,
          author_id: uid!,
        },
      })
    );
    if (!deleteResult) throw ToastData.unknown;

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
