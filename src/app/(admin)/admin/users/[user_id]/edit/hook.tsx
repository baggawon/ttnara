"use client";

import type { level_setting } from "@prisma/client";
import type { LevelReadProps } from "@/app/api/admin_di2u3k2j/settings/level/read";
import type { UserForAdmin } from "@/app/api/admin_di2u3k2j/users/read";
import type { userUpdateProps } from "@/app/api/admin_di2u3k2j/user/update";
import type { UserSettings } from "@/app/api/signup/read";

import { useToast } from "@/components/ui/use-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminLevelGet, adminUserGet, userSettingsGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { userDefault } from "@/helpers/defaultValue";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";

export const useAdminUserEditHook = (user_id: string) => {
  const { data: userData } = useGetQuery<UserForAdmin, { user_id: string }>(
    {
      queryKey: [{ [QueryKey.user]: user_id }],
    },
    adminUserGet,
    { user_id }
  );
  console.log("Debug userData:", JSON.stringify(userData, null, 2));
  const { data: levelData } = useGetQuery<level_setting, LevelReadProps>(
    {
      queryKey: [QueryKey.levelSettings],
    },
    adminLevelGet
  );
  const { data: userSettingData } = useGetQuery<UserSettings, undefined>(
    {
      queryKey: [QueryKey.signupSettings],
    },
    userSettingsGet
  );

  const methods = useForm<UserForAdmin>({
    defaultValues: userData ?? userDefault(),
    values: userData ?? undefined,
    reValidateMode: "onSubmit",
  });

  const router = useRouter();

  const goBackList = () => {
    router.push(AdminAppRoute.Users);
  };

  const cancelEdit = () => {
    router.push(`${AdminAppRoute.Users}/${user_id}`);
  };

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const submit = async (props: UserForAdmin) => {
    if (!props || !props?.profile) {
      console.error("Missing editUserData or profile:", props);
      return;
    }
    setLoading();

    try {
      // Validate and convert numeric fields
      const tradeCount = Number(props.trade_count);
      const userLevel = Number(props.profile.user_level);
      const authLevel = Number(props.profile.auth_level);
      const point = Number(props.profile.point);

      // Validate numeric conversions
      if (
        isNaN(tradeCount) ||
        isNaN(userLevel) ||
        isNaN(authLevel) ||
        isNaN(point)
      ) {
        const error = new Error("Invalid numeric value provided");
        throw error;
      }

      // Validate nickname length if provided
      if (props.profile.displayname && userSettingData) {
        const { min_displayname_length, max_displayname_length } =
          userSettingData;
        const displaynameLength = props.profile.displayname.length;

        if (
          displaynameLength < min_displayname_length ||
          displaynameLength > max_displayname_length
        ) {
          throw new Error(
            `닉네임은 ${min_displayname_length}이상 ${max_displayname_length}이하의 길이로 입력해주세요.`
          );
        }
      }

      const editUserData: userUpdateProps = {
        id: props.id,
        is_active: props.is_active,
        username: props.username,
        trade_count: tradeCount,
        profile: {
          auth_level: authLevel,
          user_level: userLevel,
          displayname: props.profile.displayname,
          is_app_admin: props.profile.is_app_admin,
          point: point,
          email: props.profile.email,
          has_warranty: props.profile.has_warranty,
          warranty_deposit_amount: props.profile.warranty_deposit_amount,
        },
      };

      const { isSuccess, hasMessage } = await postJson<userUpdateProps>(
        ApiRoute.adminUserUpdate,
        editUserData
      );

      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.user);
        goBackList();
      }
    } catch (error) {
      toast({
        id: error instanceof Error ? error.message : ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  return {
    methods,
    userData,
    levelData,
    userSettingData,
    goBackList,
    cancelEdit,
    submit,
  };
};
