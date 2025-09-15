import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { forEach } from "@/helpers/basic";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import type { UserAndSettings } from "@/helpers/types";
import type { settings } from "@prisma/client";

export const GET = async (queryParams: any) => {
  try {
    const { uid } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );
    const userData:
      | (Omit<UserAndSettings, "settings"> & { settings: settings[] })
      | undefined
      | null = await handleConnect((prisma) =>
      prisma.user.findUnique({
        where: {
          id: uid,
        },
        include: {
          settings: true,
          profile: {
            select: {
              phone_number: true,
              phone_is_validated: true,
              email: true,
              email_is_validated: true,
              displayname: true,
              auth_level: true,
              kyc_id: true,
              is_app_admin: true,
              has_warranty: true,
              warranty_deposit_amount: true,
              current_rank_level: true,
              current_rank_name: true,
              current_rank_image: true,
            },
          },
          _count: {
            select: {
              message_inbox: {
                where: {
                  is_read: false,
                },
              },
            },
          },
        },
      })
    );
    const hasUserData = userData?.id;
    if (!hasUserData) throw ToastData.unknown;

    const convertUserData = { ...userData, settings: {} } as UserAndSettings;

    if (userData.settings.length > 0) {
      const settingData: any = {};
      forEach(userData.settings, (setting) => {
        settingData[setting.key] = setting.value;
        if (setting.value === "true") settingData[setting.key] = true;
        if (setting.value === "false") settingData[setting.key] = false;
      });
      convertUserData.settings = settingData;
    }
    return {
      result: true,
      data: convertUserData,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
