import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import bcrypt from "bcrypt";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import type { user_setting } from "@prisma/client";
import { ForgotTypes, ValidateStatus } from "@/helpers/types";

export interface ForgotProps {
  forgotType: ForgotTypes;
  email: string;
  request_id: string;
  password?: string;
  passwordConfirm?: string;
}

export const POST = async (json: ForgotProps) => {
  try {
    const { forgotType, request_id, email }: ForgotProps = json;
    const userSettings = appCache.getByKey(CacheKey.UserSettings) as
      | user_setting
      | undefined;
    const isAblePropsToForgot =
      Object.values(ForgotTypes).includes(forgotType) &&
      typeof request_id === "string" &&
      typeof email === "string" &&
      userSettings;

    if (isAblePropsToForgot) {
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

      if (forgotType === ForgotTypes.Password) {
        if (
          !json.password ||
          !json.passwordConfirm ||
          json.password !== json.passwordConfirm
        )
          throw ToastData.unknown;

        const updateResult = await handleConnect(async (prisma) =>
          prisma.user.updateMany({
            where: {
              profile: {
                email,
              },
            },
            data: {
              password: await bcrypt.hash(json.password!, 10),
            },
          })
        );

        if (!updateResult) throw ToastData.unknown;

        return {
          result: true,
          message: ToastData.passwordUpdate,
        };
      }
      if (forgotType === ForgotTypes.Id) {
        const user = await handleConnect((prisma) =>
          prisma.user.findFirst({
            where: {
              profile: {
                email,
              },
            },
          })
        );

        if (!user) throw ToastData.unknown;

        return {
          result: true,
          data: user.username,
        };
      }
    }
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
  return {
    result: false,
    message: ToastData.unknown,
  };
};
