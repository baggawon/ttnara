"use client";

import { useToast } from "@/components/ui/use-toast";
import { cleanFormData, postJson, refreshCache } from "@/helpers/common";
import { adminThreadGeneralSettingsGet } from "@/helpers/get";
import type { thread_setting } from "@prisma/client";
import type { GeneralReadProps } from "@/app/api/admin_di2u3k2j/settings/general/read";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useForm } from "react-hook-form";
import { threadSettingDefault } from "@/helpers/defaultValue";
import type { threadGeneralSettingsUpdateProps } from "@/app/api/admin_di2u3k2j/settings/thread/update";

export const useAdminThreadGeneralEditHook = () => {
  const { data: threadSettingsData } = useGetQuery<
    thread_setting,
    GeneralReadProps
  >(
    {
      queryKey: [QueryKey.threadSettings],
    },
    adminThreadGeneralSettingsGet
  );

  const methods = useForm<thread_setting>({
    defaultValues: threadSettingDefault(),
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => {
      if (threadSettingsData) {
        methods.reset({
          ...threadSettingsData,
        });
      }
    },
    dependency: [threadSettingsData],
  });

  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const submit = async (props: thread_setting) => {
    setLoading();
    cleanFormData(props, {
      keysToNullify: ["default_topic_id"],
      keysToNumber: [
        "post_delete_days",
        "post_search_limit",
        "post_interval_seconds",
        "max_thread_title_length",
        "max_thread_content_length",
        "max_thread_comment_length",
        "min_thread_title_length",
        "min_thread_content_length",
        "min_thread_comment_length",
        "level_read",
        "level_create",
        "level_comment",
        "level_download",
        "level_moderator",
        "max_file_size_mb",
        "max_upload_items",
        "thread_page_size",
        "thread_page_nav_size",
        "points_per_post_create",
        "points_per_post_read",
        "points_per_comment_create",
        "points_per_file_download",
        "points_per_upvote",
        "points_per_downvote",
        "thread_disable_edit",
        "thread_disable_delete",
      ],
    });

    try {
      const { isSuccess, hasMessage } =
        await postJson<threadGeneralSettingsUpdateProps>(
          ApiRoute.adminThreadSettingsGeneralUpdate,
          props
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(props);
        refreshCache(queryClient, QueryKey.threadSettings);
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  return {
    methods,
    threadSettingsData,
    submit,
  };
};
