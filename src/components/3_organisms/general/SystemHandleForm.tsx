"use client";

import type { general_setting } from "@prisma/client";
import type { GeneralReadProps } from "@/app/api/admin_di2u3k2j/settings/general/read";
import type { generalUpdateProps } from "@/app/api/admin_di2u3k2j/settings/general/update";
import clsx from "clsx";
import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { removeColumnsFromObject } from "@/helpers/basic";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { generalDefault } from "@/helpers/defaultValue";
import { adminGeneralGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { FormProvider, useForm } from "react-hook-form";

export const SystemHandleForm = ({ className }: { className?: string }) => {
  const { data: generalData } = useGetQuery<general_setting, GeneralReadProps>(
    {
      queryKey: [QueryKey.generalSettings],
    },
    adminGeneralGet
  );

  const methods = useForm({
    defaultValues: generalDefault(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  useEffectFunctionHook({
    Function: () => {
      if (generalData) methods.reset(generalData);
    },
    dependency: [generalData],
  });
  const trySave = async (props: general_setting) => {
    setLoading();
    try {
      const { isSuccess, hasMessage } = await postJson<generalUpdateProps>(
        ApiRoute.adminGeneralUpdate,
        removeColumnsFromObject(props, [
          "site_name",
          "site_description",
          "general_manager_id",
          "user_logs_delete_days",
          "admin_logs_delete_days",
          "active_user_interval_seconds",
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

  return (
    <FormProvider {...methods}>
      <Form
        onSubmit={trySave}
        className={clsx(
          "w-full grid grid-cols-1 sm:grid-cols-3 gap-4",
          className
        )}
      >
        <FormBuilder name="maintenance_mode" label="유지보수 모드">
          <div className="w-full">
            <SwitchInput name="maintenance_mode" />
            <CardDescription className="text-xs w-full">
              유지보수 모드가 활성화되면 사이트 접근이 제한됩니다. 개발팀만 접근
              가능합니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <FormBuilder name="allow_user_registration" label="회원가입 허용">
          <div className="w-full">
            <SwitchInput name="allow_user_registration" />
            <CardDescription className="text-xs w-full">
              해제하면 새로운 회원가입이 제한됩니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <FormBuilder name="allow_login" label="로그인 허용">
          <div className="w-full">
            <SwitchInput name="allow_login" />
            <CardDescription className="text-xs w-full">
              해제하면 관리자 포함 모든 로그인이 제한됩니다. 개발팀만 접근
              가능합니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <Button type="submit" className="w-fit col-span-1 sm:col-span-3">
          저장
        </Button>
      </Form>
    </FormProvider>
  );
};
