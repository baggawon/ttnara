"use client";

import { useToast } from "@/components/ui/use-toast";
import { cleanFormData, postJson, refreshCache } from "@/helpers/common";
import { adminTetherSettingsGet } from "@/helpers/get";
import type { tether_setting } from "@prisma/client";
import type { TetherSettingsReadProps } from "@/app/api/admin_di2u3k2j/settings/tether/read";
import type { TetherSettingsUpdateProps } from "@/app/api/admin_di2u3k2j/settings/tether/update";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useForm } from "react-hook-form";
import { tetherSettingDefault } from "@/helpers/defaultValue";
import { useRouter } from "next/navigation";

export const useAdminTetherSettingsHook = () => {
  const { data: tetherSettingsData } = useGetQuery<
    tether_setting,
    TetherSettingsReadProps
  >(
    {
      queryKey: [QueryKey.adminTetherSettings],
    },
    adminTetherSettingsGet
  );

  const methods = useForm<tether_setting>({
    defaultValues: tetherSettingDefault(),
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => {
      if (tetherSettingsData) {
        methods.reset({ ...tetherSettingsData });
      }
    },
    dependency: [tetherSettingsData],
  });

  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();
  const router = useRouter();

  const submit = async (props: tether_setting) => {
    setLoading();
    cleanFormData(props, {
      keysToNumber: [
        "min_thread_title_length",
        "max_thread_title_length",
        "min_thread_content_length",
        "max_thread_content_length",
        "max_file_size_mb",
        "max_upload_items",
      ],
    });

    try {
      const { isSuccess, hasMessage } =
        await postJson<TetherSettingsUpdateProps>(
          ApiRoute.adminTetherSettingsUpdate,
          props
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(props);
        refreshCache(queryClient, QueryKey.adminTetherSettings);
        refreshCache(queryClient, QueryKey.tetherSettings);
        router.refresh();
      }
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    disableLoading();
  };

  return {
    methods,
    tetherSettingsData,
    submit,
  };
};
