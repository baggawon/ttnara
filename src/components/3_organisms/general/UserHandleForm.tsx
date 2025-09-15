"use client";

import type { user_setting } from "@prisma/client";
import type { UserReadProps } from "@/app/api/admin_di2u3k2j/settings/user/read";
import type { userUpdateProps } from "@/app/api/admin_di2u3k2j/settings/user/update";
import clsx from "clsx";
import Form from "@/components/1_atoms/Form";
import { FormInput } from "@/components/2_molecules/Input/FormInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { userSettingDefault } from "@/helpers/defaultValue";
import { adminUserSettingGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import {
  validateUserDeleteDays,
  validateGeneralAuthLevel,
  validateGeneralUserLevel,
  validateMaxDisplayNameLength,
  validateMinDisplayNameLength,
} from "@/helpers/validate";
import { FormProvider, useForm } from "react-hook-form";

export const UserHandleForm = ({ className }: { className?: string }) => {
  const { data: userData } = useGetQuery<user_setting, UserReadProps>(
    {
      queryKey: [QueryKey.userSettings],
    },
    adminUserSettingGet
  );

  const methods = useForm({
    defaultValues: userSettingDefault(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  useEffectFunctionHook({
    Function: () => {
      if (userData) methods.reset(userData);
    },
    dependency: [userData],
  });
  const trySave = async (props: user_setting) => {
    setLoading();
    props.min_displayname_length = Number(props.min_displayname_length);
    props.max_displayname_length = Number(props.max_displayname_length);
    props.default_auth_level = Number(props.default_auth_level);
    props.default_user_level = Number(props.default_user_level);
    props.user_delete_days = Number(props.user_delete_days);
    try {
      const { isSuccess, hasMessage } = await postJson<userUpdateProps>(
        ApiRoute.adminUserSettingUpdate,
        props
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.userSettings);
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  return (
    <FormProvider {...methods}>
      <Form
        onSubmit={trySave}
        className={clsx(
          "w-full grid grid-cols-1 sm:grid-cols-3 gap-4",
          className
        )}
      >
        <WithUseWatch
          name={["min_displayname_length", "max_displayname_length"]}
        >
          {({
            min_displayname_length,
            max_displayname_length,
          }: user_setting) => (
            <>
              <FormInput
                name="min_displayname_length"
                label="닉네임 최소 길이"
                validate={(value) =>
                  validateMinDisplayNameLength(
                    value,
                    String(max_displayname_length)
                  )
                }
              />
              <FormInput
                name="max_displayname_length"
                label="닉네임 최대 길이"
                validate={(value) =>
                  validateMaxDisplayNameLength(
                    value,
                    String(min_displayname_length)
                  )
                }
              />
            </>
          )}
        </WithUseWatch>
        <FormInput
          name="default_auth_level"
          label="기본 권한 레벨"
          validate={validateGeneralAuthLevel}
        />
        <FormInput
          name="default_user_level"
          label="기본 사용자 레벨"
          validate={validateGeneralUserLevel}
        />
        <FormInput
          name="user_delete_days"
          label="비활성된 유저 데이터 유지기간 (일)"
          inputClassName="flex flex-col gap-2"
          validate={validateUserDeleteDays}
        >
          <CardDescription className="text-xs w-full">
            0으로 설정하면 무제한입니다.
          </CardDescription>
        </FormInput>
        <Button type="submit" className="w-fit col-span-1 sm:col-span-3">
          저장
        </Button>
      </Form>
    </FormProvider>
  );
};
