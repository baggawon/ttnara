import {
  makeMessagePayload,
  RequestValidator,
  requestValidator,
  sendWebpush,
  type WebPushPayload,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { filterMap } from "@/helpers/basic";
import { v4 as uuidv4 } from "uuid";
import { AlarmTypes } from "@/helpers/types";

export interface MessageCreatePostProps {
  to_uid: string;
  contents: string;
}

export const POST = async (json: MessageCreatePostProps) => {
  try {
    const { uid } = await requestValidator([RequestValidator.User], json);

    if (typeof json?.to_uid !== "string" || typeof json?.contents !== "string")
      throw ToastData.unknown;

    await sendMessages(json, uid!);

    return {
      result: true,
      message: ToastData.messageCreate,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};

export const sendMessages = async (
  json: MessageCreatePostProps,
  uid: string
) => {
  const toUidResult = await handleConnect((prisma) =>
    prisma.user.findMany({
      select: webPushUserSelect,
      where: {
        OR: [
          {
            profile: {
              displayname: {
                in: filterMap(json.to_uid.split(","), (id) =>
                  id.trimStart().trimEnd()
                ),
              },
            },
          },
          { id: uid },
        ],
      },
    })
  );
  if (!toUidResult) throw ToastData.unknown;
  if (toUidResult.length === 1) throw ToastData.messageNoUser;

  const senderDisplayname = toUidResult.find(
    (innerUser) => innerUser.id === uid
  )?.profile?.displayname;

  const payloads: WebPushPayload[] = [];
  const messageData: {
    id: string;
    contents: string;
    from_uid: string;
    to_uid: string;
  }[] = filterMap(toUidResult, (user) => {
    if (user.id !== uid) {
      const payload = makeMessagePayload({
        body: `${senderDisplayname}님에게 쪽지가 도착했습니다.`,
        user,
        type: AlarmTypes.Message,
      });
      payloads.push(payload);
    }
    return (
      user.id !== uid && {
        id: uuidv4(),
        contents: json.contents,
        from_uid: uid,
        to_uid: user.id,
      }
    );
  });

  const [inboxResult, historyResult] = await Promise.all([
    handleConnect((prisma) =>
      prisma.message_inbox.createMany({
        data: messageData,
      })
    ),
    handleConnect((prisma) =>
      prisma.message_history.createMany({
        data: messageData,
      })
    ),
  ]);
  if (!inboxResult || !historyResult) throw ToastData.unknown;

  await sendWebpush(payloads, toUidResult);
};
