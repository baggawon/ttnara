import { handleConnect } from "@/helpers/server/prisma";
import {
  checkUserStatus,
  isExistUserId,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import bcrypt from "bcrypt";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import type { general_setting, user_setting } from "@prisma/client";
import { UserSettings, ValidateStatus } from "@/helpers/types";
import { map } from "@/helpers/basic";

export interface SignupProps {
  email: string;
  username: string;
  displayname: string;
  password: string;
  phone_number: string;
  request_id: string;
}

export const POST = async (json: SignupProps) => {
  try {
    const generalSettings = appCache.getByKey(CacheKey.GeneralSettings) as
      | general_setting
      | undefined;

    if (generalSettings?.allow_user_registration === false)
      throw ToastData.notAllowSignup;

    const {
      username,
      displayname,
      phone_number,
      password,
      email,
      request_id,
    }: SignupProps = json;
    const userSettings = appCache.getByKey(CacheKey.UserSettings) as
      | user_setting
      | undefined;
    const isAblePropsToSignup =
      typeof username === "string" &&
      typeof displayname === "string" &&
      typeof phone_number === "string" &&
      typeof password === "string" &&
      typeof email === "string" &&
      typeof request_id === "string" &&
      userSettings;

    if (isAblePropsToSignup) {
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

      const isUser = await isExistUserId(username);
      const isExistDisplayname = await handleConnect((prisma) =>
        prisma.profile.findFirst({
          where: {
            displayname,
          },
        })
      );

      if (isUser) {
        const error = checkUserStatus(isUser);
        if (error) throw error;
        throw ToastData.alreadyExistId;
      }

      if (isExistDisplayname) throw ToastData.alreadyExistDisplayname;

      const hash = await bcrypt.hash(password, 10);

      const user = await handleConnect((prisma) =>
        prisma.user.create({
          data: {
            username,
            password: hash,
            profile: {
              create: {
                displayname,
                phone_number,
                email,
                email_is_validated: true,
                auth_level: userSettings.default_auth_level,
                user_level: userSettings.default_user_level,
              },
            },
            settings: {
              createMany: {
                data: map(Object.keys(UserSettings), (setting) => ({
                  key: setting,
                  value: "true",
                })),
                skipDuplicates: true,
              },
            },
          },
        })
      );
      const isSuccessToCreate = user?.id;

      if (!isSuccessToCreate) throw ToastData.unknown;

      return {
        result: true,
        message: ToastData.signup,
      };
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
