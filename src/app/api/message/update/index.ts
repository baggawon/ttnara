import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface messageUpdateProps {
  useAdmin?: boolean;
  id: string;
  is_read: boolean;
}

export const POST = async (json: messageUpdateProps) => {
  try {
    if (typeof json?.id !== "string" || typeof json?.is_read !== "boolean")
      throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const [inboxResult, historyResult] = await Promise.all([
      handleConnect((prisma) =>
        prisma.message_inbox.update({
          where: {
            id: json.id,
            to_uid: uid!,
          },
          data: {
            is_read: json.is_read,
          },
        })
      ),
      handleConnect((prisma) =>
        prisma.message_history.update({
          where: {
            id: json.id,
            to_uid: uid!,
          },
          data: {
            is_read: json.is_read,
          },
        })
      ),
    ]);
    if (!inboxResult || !historyResult) throw ToastData.unknown;

    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
