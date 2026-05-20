import {
  RequestValidator,
  requestValidator,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { AlarmTypes, UserSettings } from "@/helpers/types";

export interface PushSendProps {
  title: string;
  body: string;
  url?: string;
  category: string;
  template_id?: number;
}

export const POST = async (json: PushSendProps) => {
  try {
    const { uid } = await requestValidator([RequestValidator.Admin], json);
    if (!uid) throw ToastData.noAuth;

    // Admin manual push: send to all users with push tokens,
    // excluding only those who explicitly disabled board_notification
    const users = await handleConnect((prisma) =>
      prisma.user.findMany({
        where: {
          push_token: { isEmpty: false },
          NOT: {
            settings: {
              some: {
                key: UserSettings.board_notification,
                value: "false",
              },
            },
          },
        },
        select: webPushUserSelect,
      })
    );

    const recipientCount = users?.length ?? 0;

    // Always record history, even if 0 recipients
    await handleConnect((prisma) =>
      prisma.push_history.create({
        data: {
          title: json.title,
          body: json.body,
          url: json.url || null,
          category: json.category || "general",
          template_id: json.template_id || null,
          sent_by: uid,
          recipient_count: recipientCount,
          target_type: "all",
        },
      })
    );

    if (!users || users.length === 0) {
      return {
        result: true,
        isSuccess: true,
        hasMessage: "발송 대상 사용자가 없습니다.",
        data: { recipient_count: 0 },
      };
    }

    const notificationUrl = json.url || process.env.NEXTAUTH_URL || "";

    const payloads = users.map((user) => ({
      title: json.title,
      body: json.body,
      url: notificationUrl,
      uid: user.id,
      tokens: user.push_token,
      type: AlarmTypes.AdminManualPush,
    }));

    await sendWebpush(payloads, users);

    return {
      result: true,
      isSuccess: true,
      hasMessage: ToastData.pushSend,
      data: { recipient_count: recipientCount },
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: ToastData.pushSendFailed,
      message: String(error),
    };
  }
};
