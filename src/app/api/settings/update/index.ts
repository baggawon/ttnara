import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { UserSettings } from "@/helpers/types";
import { map } from "@/helpers/basic";

export interface SettingsUpdateProps {
  settings: {
    [key in UserSettings]: boolean;
  };
}

export const POST = async (json: SettingsUpdateProps) => {
  try {
    if (typeof json?.settings !== "object") throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const updateResult = await handleConnect((prisma) =>
      Promise.all(
        map(Object.entries(json.settings), ([key, value]) => {
          return prisma.settings.upsert({
            create: {
              key,
              value: String(value),
              uid: uid!,
            },
            update: {
              value: String(value),
            },
            where: {
              uid_key: {
                key,
                uid: uid!,
              },
            },
          });
        })
      )
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
