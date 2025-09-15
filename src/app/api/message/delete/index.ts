import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { MessageType } from "@/helpers/types";
import type { Prisma } from "@prisma/client";
import type { DefaultArgs } from "@prisma/client/runtime/library";

export interface messageDeleteProps {
  useAdmin?: boolean;
  id: string;
  messageType: MessageType;
}

export const POST = async (json: messageDeleteProps) => {
  try {
    if (
      typeof json?.id !== "string" ||
      !Object.values(MessageType).includes(json?.messageType)
    )
      throw ToastData.unknown;
    const { uid } = await requestValidator([RequestValidator.User], json);

    const targetDB =
      json.messageType === MessageType.inbox
        ? "message_inbox"
        : "message_history";
    const messageData = await handleConnect((prisma) =>
      (prisma[targetDB] as Prisma.message_inboxDelegate<DefaultArgs>).delete({
        where: {
          id: json.id,
          OR: [{ to_uid: uid! }, { from_uid: uid! }],
        },
      })
    );
    if (!messageData) throw ToastData.unknown;

    return {
      result: true,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
