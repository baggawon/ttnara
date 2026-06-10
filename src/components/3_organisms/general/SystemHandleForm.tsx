"use client";

import type {
  GeneralReadProps,
  GeneralReadResult,
} from "@/app/api/admin_di2u3k2j/settings/general/read";
import type { generalUpdateProps } from "@/app/api/admin_di2u3k2j/settings/general/update";
import clsx from "clsx";
import Form from "@/components/1_atoms/Form";
import { FormBuilder } from "@/components/2_molecules/Input/FormInput";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generalDefault } from "@/helpers/defaultValue";
import { adminGeneralGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { FormProvider, useForm } from "react-hook-form";

export const SystemHandleForm = ({ className }: { className?: string }) => {
  const { data: generalData } = useGetQuery<
    GeneralReadResult,
    GeneralReadProps
  >(
    {
      queryKey: [QueryKey.generalSettings],
    },
    adminGeneralGet,
    undefined,
    { silent: true }
  );

  const methods = useForm({
    defaultValues: generalDefault(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffectFunctionHook({
    Function: () => {
      if (generalData) methods.reset(generalData);
    },
    dependency: [generalData],
  });

  const saveMutation = useMutation({
    mutationFn: async (props: generalUpdateProps) => {
      const { isSuccess, hasMessage } = await postJson<generalUpdateProps>(
        ApiRoute.adminGeneralUpdate,
        {
          id: props.id,
          allow_user_registration: props.allow_user_registration,
          show_seo: props.show_seo,
          show_price_calc: props.show_price_calc,
          show_price_ticker: props.show_price_ticker,
          show_profile_widget: props.show_profile_widget,
        }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.generalSettings);
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const trySave = (props: generalUpdateProps) => {
    if (saveMutation.isPending) return;
    saveMutation.mutate(props);
  };
  const isSubmitting = saveMutation.isPending;

  return (
    <FormProvider {...methods}>
      <Form
        onSubmit={trySave}
        className={clsx(
          "w-full grid grid-cols-1 sm:grid-cols-3 gap-4",
          className
        )}
      >
        <FormBuilder name="allow_user_registration" label="회원가입 허용">
          <div className="w-full">
            <SwitchInput name="allow_user_registration" />
            <CardDescription className="text-xs w-full">
              해제하면 새로운 회원가입이 제한됩니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <FormBuilder name="show_seo" label="홈 SEO 컨텐츠 표시">
          <div className="w-full">
            <SwitchInput name="show_seo" />
            <CardDescription className="text-xs w-full">
              해제하면 메인 홈의 SEO 컨텐츠가 숨겨집니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <FormBuilder name="show_price_calc" label="가격 계산기 위젯 표시">
          <div className="w-full">
            <SwitchInput name="show_price_calc" />
            <CardDescription className="text-xs w-full">
              해제하면 우측 사이드의 환율 계산기 위젯이 숨겨집니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <FormBuilder name="show_price_ticker" label="시세 티커 위젯 표시">
          <div className="w-full">
            <SwitchInput name="show_price_ticker" />
            <CardDescription className="text-xs w-full">
              해제하면 우측 사이드 시세 위젯과 모바일 상단 시세 티커가 함께
              숨겨집니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <FormBuilder name="show_profile_widget" label="프로필 위젯 표시">
          <div className="w-full">
            <SwitchInput name="show_profile_widget" />
            <CardDescription className="text-xs w-full">
              해제하면 우측 사이드의 프로필 위젯이 숨겨집니다.
            </CardDescription>
          </div>
        </FormBuilder>
        <Button
          type="submit"
          className="w-fit col-span-1 sm:col-span-3"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          저장
        </Button>
      </Form>
    </FormProvider>
  );
};
