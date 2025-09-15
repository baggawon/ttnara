import type { MessageDatas } from "@/helpers/types";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { messageGet } from "@/helpers/get";
import type { MessageReadProps } from "@/app/api/message/read";
import { useRouter } from "next/navigation";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { postJson } from "@/helpers/common";
import type { messageUpdateProps } from "@/app/api/message/update";
import { updateTargetMessageCache } from "@/helpers/optimistic";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import useMessageDelete from "@/helpers/customHook/useMessageDelete";

const MessageInboxDetailHook = (messageId: string) => {
  const router = useRouter();

  const { data: messagesData } = useGetQuery<MessageDatas, MessageReadProps>(
    {
      queryKey: [QueryKey.message],
    },
    messageGet,
    { history: true, inbox: true }
  );

  const messageIndex = messagesData?.inbox?.findIndex(
    (message) => message.id === String(messageId)
  );
  const messageData =
    messageIndex !== undefined && messageIndex >= 0
      ? messagesData?.inbox?.[messageIndex]
      : undefined;

  const canPreview = (): boolean =>
    !!messagesData &&
    typeof messageIndex === "number" &&
    messageIndex < (messagesData?.inbox?.length ?? 0) - 1;

  const canNext = (): boolean => !!messageIndex && messageIndex > 0;

  const goPreview = () => {
    if (canPreview()) {
      router.push(
        `${AppRoute.MessageInbox}/${messagesData!.inbox[messageIndex! + 1].id}`
      );
    }
  };

  const goNext = () => {
    if (canNext()) {
      router.push(
        `${AppRoute.MessageInbox}/${messagesData!.inbox[messageIndex! - 1].id}`
      );
    }
  };

  const { queryClient } = useLoadingHandler();

  useEffectFunctionHook({
    Function: () => {
      if (!messageData && messagesData) {
        router.push(AppRoute.MessageInbox);
      }
    },
    dependency: [messageData, messagesData],
  });

  useEffectFunctionHook({
    Function: () => {
      if (messageData && messageData.is_read === false) {
        const updatedData = { id: messageData.id, is_read: true };
        const { restore } = updateTargetMessageCache(updatedData, queryClient);
        postJson<messageUpdateProps>(
          ApiRoute.messageUpdate,
          updatedData,
          restore
        );
      }
    },
    dependency: [messageData],
  });

  const { tryDelete, DeleteConfirmModal } = useMessageDelete({
    onSuccess: () => router.push(AppRoute.MessageInbox),
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

export default MessageInboxDetailHook;
