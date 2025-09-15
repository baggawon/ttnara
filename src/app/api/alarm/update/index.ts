import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface alarmUpdateProps {
  id: string[];
  is_read: boolean;
}

export const POST = async (json: alarmUpdateProps) => {
  try {
    if (
      typeof json?.id?.length !== "number" ||
      typeof json?.is_read !== "boolean"
    )
      throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const updateResult = await handleConnect((prisma) =>
      prisma.alarm.updateMany({
        where: {
          id: {
            in: json.id,
          },
          user_id: uid!,
        },
        data: {
          is_read: json.is_read,
        },
      })
    );
    if (!updateResult) throw ToastData.unknown;

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
