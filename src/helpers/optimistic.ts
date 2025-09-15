import type { QueryClient } from "@tanstack/react-query";
import type { Message, MessageDatas } from "@/helpers/types";
import { MessageType } from "@/helpers/types";
import { QueryKey } from "@/helpers/types";
import { filterMap, map } from "@/helpers/basic";
import { orderByColumn } from "@/helpers/common";
import { useAdminModeStore } from "@/helpers/state";

const getRestore = (
  queryKey: QueryKey,
  uid: string,
  queryClient: QueryClient
) => {
  const prevData = queryClient.getQueryData<any[]>([{ [queryKey]: uid }]);
  const prevAllData = queryClient.getQueryData<any[]>([queryKey]);

  return {
    restore: () => {
      queryClient.setQueryData([{ [queryKey]: uid }], prevData);
      queryClient.setQueryData([queryKey], prevAllData);
    },
  };
};

const deleteByUid = (
  queryKey: QueryKey,
  uid: string,
  column: string,
  queryClient: QueryClient
) => {
  const restore = getRestore(queryKey, uid, queryClient);
  queryClient.removeQueries({ queryKey: [{ [queryKey]: uid }] });
  queryClient.setQueryData<any[]>([queryKey], (old) => {
    if (!old) return;
    return filterMap(old, (bot) => {
      const isMatched = bot[column] === uid;

      if (isMatched) return undefined;
      return bot;
    });
  });

  return restore;
};
const getRestoreOne = (queryKey: unknown[], queryClient: QueryClient) => {
  const prevData = queryClient.getQueryData<any[]>(queryKey);

  return {
    restore: () => {
      queryClient.setQueryData(queryKey, prevData);
    },
  };
};

const getRestoreMulti = (queryKey: unknown[], queryClient: QueryClient) => {
  const prevData = queryClient.getQueriesData<any[]>({
    queryKey,
    exact: false,
  });

  return {
    restore: () => {
      queryClient.setQueriesData({ queryKey }, prevData);
    },
  };
};

const deleteByid = (
  queryKey: QueryKey,
  id: number,
  column: string,
  queryClient: QueryClient
) => {
  const restore = getRestoreOne([queryKey], queryClient);
  queryClient.setQueryData<any[]>([queryKey], (old) => {
    if (!old) return;
    return filterMap(old, (item) => {
      const isMatched = item[column] === id;

      if (isMatched) return undefined;
      return item;
    });
  });

  return restore;
};

export const updateMessageCache = (
  messageData: Partial<Message>,
  queryClient: QueryClient,
  queryKey: QueryKey
) => {
  const targetQueryKey = useAdminModeStore.getState().on
    ? [{ [queryKey]: "main" }]
    : [queryKey];
  const restore = getRestoreOne(targetQueryKey, queryClient);
  queryClient.setQueryData<MessageDatas>(targetQueryKey, (old) => {
    if (!old) return;
    return {
      inbox: messageUpdater(old.inbox, messageData) ?? [],
      history: messageUpdater(old.history, messageData) ?? [],
    };
  });

  return restore;
};

const messageUpdater = (old?: Message[], targetData?: Partial<Message>) => {
  if (!old) return;
  return orderByColumn({
    data: map(old, (message) => {
      const isMatched = message.id === targetData?.id;

      if (isMatched) return { ...message, ...targetData };
      return message;
    }),
    column: "id",
    method: "desc",
  });
};

export const updateTargetMessageCache = (
  messageData: Partial<Message>,
  queryClient: QueryClient
) => {
  const messages = getRestoreOne([QueryKey.message], queryClient);
  queryClient.setQueryData<MessageDatas>([QueryKey.message], (old) => {
    if (!old) return;
    return {
      inbox: messageUpdater(old.inbox, messageData) ?? [],
      history: messageUpdater(old.history, messageData) ?? [],
    };
  });

  return messages;
};

export const deleteMessageCache = (
  messageId: string,
  messageType: MessageType,
  queryClient: QueryClient
) => {
  const restore = getRestoreOne([QueryKey.message], queryClient);
  queryClient.setQueryData<MessageDatas>([QueryKey.message], (old) => {
    if (!old) return;
    return {
      inbox: filterMap(old.inbox, (item) => {
        const isMatched =
          item.id === messageId && messageType === MessageType.inbox;

        if (isMatched) return undefined;
        return item;
      }),
      history: filterMap(old.history, (item) => {
        const isMatched =
          item.id === messageId && messageType === MessageType.history;

        if (isMatched) return undefined;
        return item;
      }),
    };
  });

  return restore;
};
