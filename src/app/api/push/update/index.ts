import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { PushType } from "@/helpers/types";

export interface PushUpdateProps {
  data: string;
  type: PushType;
}

export const POST = async (json: PushUpdateProps) => {
  try {
    if (typeof json?.data !== "string" || json?.data === "")
      throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const getResult = await handleConnect((prisma) =>
      prisma.user.findUnique({
        where: {
          id: uid!,
        },
        select: {
          push_token: true,
        },
      })
    );
    if (!getResult) throw ToastData.unknown;

    if (json.type === PushType.Subscribe) {
      if (!getResult.push_token.includes(json.data)) {
        getResult.push_token.push(json.data);
        await handleConnect((prisma) =>
          prisma.user.update({
            where: {
              id: uid!,
            },
            data: {
              push_token: getResult.push_token,
            },
          })
        );
      } else {
        return {
          result: true,
        };
      }
    } else if (json.type === PushType.Unsubscribe) {
      if (getResult.push_token.includes(json.data)) {
        getResult.push_token = getResult.push_token.filter(
          (token) => token !== json.data
        );
        await handleConnect((prisma) =>
          prisma.user.update({
            where: {
              id: uid!,
            },
            data: {
              push_token: getResult.push_token,
            },
          })
        );
      } else {
        return {
          result: true,
        };
      }
    }

    return {
      result: true,
      message:
        json.type === PushType.Subscribe
          ? ToastData.subscribePush
          : ToastData.unsubscribePush,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
