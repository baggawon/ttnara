import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { forEach } from "@/helpers/basic";
import type { Message } from "@/helpers/types";

export interface MessageReadProps {
  inbox?: boolean;
  history?: boolean;
  useAdmin?: boolean;
}

export const GET = async (queryParams: MessageReadProps) => {
  try {
    const { uid, isAdmin, isPersonal } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );

    const adminUid = await isAdmin();
    if (!isPersonal && !adminUid) throw ToastData.noAuth;

    const isAdminCondition = !isPersonal && !!adminUid;

    const getInbox = async () => {
      if (isAdminCondition || (!isAdminCondition && queryParams.inbox)) {
        return await handleConnect((prisma) =>
          prisma.message_inbox.findMany({
            ...(!isAdminCondition && {
              where: {
                to_uid: uid,
              },
            }),
            orderBy: [{ created_at: Prisma.SortOrder.desc }],
          })
        );
      }
    };
    const getHistory = async () => {
      if (isAdminCondition || (!isAdminCondition && queryParams.history)) {
        return await handleConnect((prisma) =>
          prisma.message_history.findMany({
            ...(!isAdminCondition && {
              where: {
                from_uid: uid,
              },
            }),
            orderBy: [{ created_at: Prisma.SortOrder.desc }],
          })
        );
      }
    };

    const [inboxData, historyData] = await Promise.all([
      getInbox(),
      getHistory(),
    ]);
    if (!inboxData && !historyData) throw ToastData.unknown;

    const uidList = new Set<string>();
    if (inboxData)
      forEach(inboxData, (message) => {
        uidList.add(message.from_uid);
        uidList.add(message.to_uid);
      });
    if (historyData)
      forEach(historyData, (message) => {
        uidList.add(message.from_uid);
        uidList.add(message.to_uid);
      });

    const userList = await handleConnect((prisma) =>
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              displayname: true,
            },
          },
        },
        where: {
          id: {
            in: [...uidList, uid!],
          },
        },
      })
    );
    if (!userList) throw ToastData.unknown;

    const userListMap: any = {};
    forEach(userList, (user) => {
      userListMap[user.id] = `${user.profile!.displayname}*&*${user.username}`;
    });

    const convertUid = (message: Message) => {
      message.from_uid = userListMap[message.from_uid];
      message.to_uid = userListMap[message.to_uid];
    };

    const inbox: Message[] = inboxData ? structuredClone(inboxData) : [];
    const history: Message[] = historyData ? structuredClone(historyData) : [];

    forEach(inbox, convertUid);
    forEach(history, convertUid);

    return {
      result: true,
      data: {
        inbox,
        history,
      },
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
