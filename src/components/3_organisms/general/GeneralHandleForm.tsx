"use client";

import type { general_setting } from "@prisma/client";
import type { GeneralReadProps } from "@/app/api/admin_di2u3k2j/settings/general/read";
import type { generalUpdateProps } from "@/app/api/admin_di2u3k2j/settings/general/update";
import type {
  UsersListResponse,
  UsersReadProps,
} from "@/app/api/admin_di2u3k2j/users/read";
import clsx from "clsx";
import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { map, removeColumnsFromObject } from "@/helpers/basic";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { generalDefault } from "@/helpers/defaultValue";
import { adminGeneralGet, adminUsersGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import {
  validateAdminLogSaveDays,
  validateSiteName,
  validateUserLogSaveDays,
} from "@/helpers/validate";
import { FormProvider, useForm } from "react-hook-form";

export const GeneralHandleForm = ({ className }: { className?: string }) => {
  const { data: generalData } = useGetQuery<general_setting, GeneralReadProps>(
    {
      queryKey: [QueryKey.generalSettings],
    },
    adminGeneralGet
  );
  const { data: usersData } = useGetQuery<UsersListResponse, UsersReadProps>(
    {
      queryKey: [QueryKey.users],
    },
    adminUsersGet,
    { is_admin: true, page: 1, pageSize: 1000 }
  );

  const methods = useForm({
    defaultValues: generalDefault({ general_manager_id: "disabled" }),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  useEffectFunctionHook({
    Function: () => {
      if (generalData)
        methods.reset({
          ...generalData,
          general_manager_id: generalData.general_manager_id || "disabled",
        });
    },
    dependency: [generalData],
  });

  const trySave = async (props: general_setting) => {
    props.user_logs_delete_days = Number(props.user_logs_delete_days);
    props.admin_logs_delete_days = Number(props.admin_logs_delete_days);
    props.active_user_interval_seconds = Number(
      props.active_user_interval_seconds
    );
    if (
      typeof props.general_manager_id !== "string" ||
      props.general_manager_id === "disabled"
    )
      props.general_manager_id = null;

    if (
      typeof props.site_description !== "string" ||
      props.site_description === ""
    )
      props.site_description = null;

    setLoading();
    try {
      const { isSuccess, hasMessage } = await postJson<generalUpdateProps>(
        ApiRoute.adminGeneralUpdate,
        removeColumnsFromObject(props, [
          "maintenance_mode",
          "allow_user_registration",
          "allow_login",
        ])
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.generalSettings);
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const convertUsers = [
    {
      value: "disabled",
      label: "해제",
    },
    ...(usersData
      ? map(usersData.users, (user) => ({
          value: user.id,
          label: `${user.username} (${user.profile?.displayname})`,
        }))
      : []),
  ];

  return (
    <FormProvider {...methods}>
      <Form
        onSubmit={trySave}
        className={clsx(
          "w-full grid grid-cols-1 sm:grid-cols-3 gap-4",
          className
        )}
      >
        <FormInput
          name="site_name"
          label="사이트 이름"
          validate={validateSiteName}
        />
        <FormInput
          name="site_description"
          label="사이트 설명"
          placeholder="사이트 설명"
        />
        <FormInput
          name="user_logs_delete_days"
          label="사용자 로그 보관 기간 (일)"
          inputClassName="flex flex-col gap-2"
          validate={validateUserLogSaveDays}
        >
          <CardDescription className="text-xs w-full">
            사용자 로그 보관 기간입니다. 0으로 설정하면 무제한입니다.
          </CardDescription>
        </FormInput>
        <FormInput
          name="admin_logs_delete_days"
          label="관리자 로그 보관 기간 (일)"
          inputClassName="flex flex-col gap-2"
          validate={validateAdminLogSaveDays}
        >
          <CardDescription className="text-xs w-full">
            관리자 로그 보관 기간입니다. 0으로 설정하면 무제한입니다.
          </CardDescription>
        </FormInput>
        <FormBuilder name="general_manager_id" label="최고 관리자">
          <SelectInput
            name="general_manager_id"
            items={convertUsers}
            buttonClassName="w-full"
            placeholder="최고 관리자를 선택해주세요."
          />
        </FormBuilder>
        <Button type="submit" className="w-fit col-span-1 sm:col-span-3">
          저장
        </Button>
      </Form>
    </FormProvider>
  );
};
