"use client";
import type { UserForAdmin } from "@/app/api/admin_di2u3k2j/users/read";
import type { UserSettings } from "@/app/api/signup/read";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminUserGet, userSettingsGet } from "@/helpers/get";
import { AdminAppRoute, QueryKey } from "@/helpers/types";

import { useRouter } from "next/navigation";

export const useAdminUserViewHook = (user_id: string) => {
  const { data: userData } = useGetQuery<UserForAdmin, { user_id: string }>(
    {
      queryKey: [{ [QueryKey.user]: user_id }],
    },
    adminUserGet,
    { user_id }
  );

  const { data: userSettingData } = useGetQuery<UserSettings, undefined>(
    {
      queryKey: [QueryKey.signupSettings],
    },
    userSettingsGet
  );

  const router = useRouter();

  const editUser = () => {
    router.push(`${AdminAppRoute.Users}/${userData?.id}/edit`);
  };

  const goBackList = () => {
    router.push(AdminAppRoute.Users);
  };

  return {
    userData,
    userSettingData,
    goBackList,
    editUser,
  };
};
