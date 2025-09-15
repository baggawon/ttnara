import bcrypt from "bcrypt";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { Prisma, user_setting } from "@prisma/client";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { validateNickName, validatePassword } from "@/helpers/validate";
import { ValidateStatus } from "@/helpers/types";
import { isCuid } from "@paralleldrive/cuid2";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface UserUpdateProps {
  password?: string;
  passwordConfirm?: string;
  email?: string;
  request_id?: string;
  displayname?: string;
}

export const POST = async (json: UserUpdateProps) => {
  try {
    const { uid } = await requestValidator([RequestValidator.User], json);

    const updateArgs: Prisma.userUpdateArgs = {
      where: {
        id: uid!,
      },
      data: {},
    };

    const { password, passwordConfirm, email, request_id, displayname } = json;
    if (!validatePassword(password) && password === passwordConfirm) {
      updateArgs.data.password = await bcrypt.hash(password!, 10);
    }

    if (
      typeof email === "string" &&
      typeof request_id === "string" &&
      request_id !== ""
    ) {
      const isValidEmail = await handleConnect((prisma) =>
        prisma.validate.findFirst({
          where: {
            email,
            request_id,
            status: ValidateStatus.valid,
          },
        })
      );
      if (!isValidEmail) throw ToastData.unknown;

      updateArgs.data.profile = { update: { email, email_is_validated: true } };
    }
    if (typeof displayname === "string" && displayname !== "") {
      const userData = await handleConnect((prisma) =>
        prisma.user.findUnique({
          where: {
            id: uid!,
          },
          select: {
            profile: {
              select: {
                displayname: true,
              },
            },
          },
        })
      );
      if (!userData) throw ToastData.unknown;

      if (
        userData.profile?.displayname &&
        isCuid(userData.profile?.displayname) &&
        userData.profile?.displayname.length === 24
      ) {
        const userSettings = appCache.getByKey(
          CacheKey.UserSettings
        ) as user_setting;
        if (!validateNickName(displayname, userSettings)) {
          const isExistDisplay = await handleConnect((prisma) =>
            prisma.profile.findFirst({
              where: {
                displayname,
              },
              select: {
                id: true,
              },
            })
          );

          if (!isExistDisplay) {
            if (updateArgs.data?.profile?.update) {
              updateArgs.data.profile.update.displayname = displayname;
            } else {
              updateArgs.data.profile = { update: { displayname } };
            }
          } else {
            throw ToastData.alreadyExistDisplayname;
          }
        } else {
          throw ToastData.unknown;
        }
      }
    }

    if (Object.keys(updateArgs.data).length > 0) {
      const userData = await handleConnect((prisma) =>
        prisma.user.update(updateArgs)
      );
      const hasUserData = userData?.id;

      if (!hasUserData) throw ToastData.unknown;
      return {
        result: true,
        message: ToastData.userUpdate,
      };
    }

    return {
      result: true,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
