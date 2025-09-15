"use client";

import type { level_setting } from "@prisma/client";
import type { LevelReadProps } from "@/app/api/admin_di2u3k2j/settings/level/read";
import type { levelUpdateProps } from "@/app/api/admin_di2u3k2j/settings/level/update";
import clsx from "clsx";
import Form from "@/components/1_atoms/Form";
import { FormInput } from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { levelDefault } from "@/helpers/defaultValue";
import { adminLevelGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { validateMaxSystemLevel } from "@/helpers/validate";
import { FormProvider, useForm } from "react-hook-form";

export const LevelHandleForm = ({ className }: { className?: string }) => {
  const { data: levelData } = useGetQuery<level_setting, LevelReadProps>(
    {
      queryKey: [QueryKey.levelSettings],
    },
    adminLevelGet
  );

  const methods = useForm({
    defaultValues: levelDefault(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  useEffectFunctionHook({
    Function: () => {
      if (levelData) methods.reset(levelData);
    },
    dependency: [levelData],
  });
  const trySave = async (props: level_setting) => {
    setLoading();
    props.max_system_level = Number(props.max_system_level);
    try {
      const { isSuccess, hasMessage } = await postJson<levelUpdateProps>(
        ApiRoute.adminLevelUpdate,
        props
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.levelSettings);
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
        <FormInput
          name="max_system_level"
          label="최대 시스템 레벨"
          inputClassName="flex flex-col gap-2"
          validate={validateMaxSystemLevel}
        >
          <CardDescription className="text-xs w-full">
            최소 1, 최대 10
          </CardDescription>
        </FormInput>
        <Button type="submit" className="w-fit col-span-1 sm:col-span-3">
          저장
        </Button>
      </Form>
    </FormProvider>
  );
};
