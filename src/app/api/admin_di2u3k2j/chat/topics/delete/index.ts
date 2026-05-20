import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatTopicDeleteProps {
  ids: number[];
  /** Cascade: also delete every chat_message + chat_fixed_message for these
   * topics. Defaults to false so an accidental call only removes the topic
   * row(s); the typed-confirmation flow in the UI sets this to true. */
  cascade?: boolean;
}

export const POST = async (json: ChatTopicDeleteProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.ids?.length) {
      return { result: false, message: "삭제할 토픽이 없습니다." };
    }

    // Snapshot affected counts so we can include them in the audit log.
    const topics =
      (await handleConnect((prisma) =>
        prisma.chat_topic.findMany({
          where: { id: { in: json.ids } },
          select: { id: true, name: true },
        })
      )) ?? [];

    let deletedMessages = 0;
    if (json.cascade) {
      const result = await handleConnect((prisma) =>
        prisma.$transaction([
          prisma.chat_fixed_message.deleteMany({
            where: { topic_id: { in: json.ids } },
          }),
          prisma.chat_message.deleteMany({
            where: { topic_id: { in: json.ids } },
          }),
          prisma.chat_topic.deleteMany({ where: { id: { in: json.ids } } }),
        ])
      );
      deletedMessages = result?.[1].count ?? 0;
    } else {
      await handleConnect((prisma) =>
        prisma.chat_topic.deleteMany({ where: { id: { in: json.ids } } })
      );
    }

    await sendChatAdminEvent({ kind: "config_changed" });

    for (const t of topics) {
      await logChatModeration({
        action: "topic_delete",
        topic_id: t.id,
        by_admin_id: adminUid ?? null,
        metadata: {
          name: t.name,
          cascade: !!json.cascade,
          deleted_messages: json.cascade ? deletedMessages : 0,
        },
      });
    }

    return { result: true, message: "삭제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
