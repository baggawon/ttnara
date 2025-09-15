import type { MessageDatas } from "@/helpers/types";
import { AppRoute, QueryKey } from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { messageGet } from "@/helpers/get";
import type { MessageReadProps } from "@/app/api/message/read";
import { useRouter } from "next/navigation";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useMessageDelete from "@/helpers/customHook/useMessageDelete";

const MessageHistoryHook = (messageId: string) => {
  const router = useRouter();

  const { data: messagesData } = useGetQuery<MessageDatas, MessageReadProps>(
    {
      queryKey: [QueryKey.message],
    },
    messageGet,
    { history: true, inbox: true }
  );

  const messageIndex = messagesData?.history?.findIndex(
    (message) => message.id === String(messageId)
  );
  const messageData =
    messageIndex !== undefined && messageIndex >= 0
      ? messagesData?.history[messageIndex]
      : undefined;

  useEffectFunctionHook({
    Function: () => {
      if (!messageData && messagesData?.history) {
        router.push(AppRoute.MessageHistory);
      }
    },
    dependency: [messageData, messagesData],
  });

  const canPreview = (): boolean =>
    !!messagesData &&
    typeof messageIndex === "number" &&
    messageIndex < (messagesData?.history?.length ?? 0) - 1;

  const canNext = (): boolean => !!messageIndex && messageIndex > 0;

  const goPreview = () => {
    if (canPreview()) {
      router.push(
        `${AppRoute.MessageHistory}/${
          messagesData!.history[messageIndex! + 1].id
        }`
      );
    }
  };

  const goNext = () => {
    if (canNext()) {
      router.push(
        `${AppRoute.MessageHistory}/${
          messagesData!.history[messageIndex! - 1].id
        }`
      );
    }
  };

  const { tryDelete, DeleteConfirmModal } = useMessageDelete({
    onSuccess: () => router.push(AppRoute.MessageHistory),
  });

  return {
    messageData,
    canPreview,
    canNext,
    goPreview,
    goNext,
    router,
    tryDelete,
    DeleteConfirmModal,
  };
};

export default MessageHistoryHook;
