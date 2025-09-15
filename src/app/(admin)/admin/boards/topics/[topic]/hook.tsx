"use client";

import type {
  TopicsListResponse,
  TopicsReadProps,
  TopicWithPoint,
} from "@/app/api/admin_di2u3k2j/topics/read";
import type { topicsUpdateProps } from "@/app/api/admin_di2u3k2j/topics/update";
import { useToast } from "@/components/ui/use-toast";
import { cleanFormData, postJson, refreshCache } from "@/helpers/common";
import { adminThreadGeneralSettingsGet } from "@/helpers/get";
import type { thread_setting } from "@prisma/client";
import type { GeneralReadProps } from "@/app/api/admin_di2u3k2j/settings/general/read";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { topicDefault } from "@/helpers/defaultValue";
import { adminTopicsGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export const useAdminTopicsEditHook = (topic_id: number) => {
  const [pagination] = useState<TopicsReadProps>({
    page: 1,
    pageSize: 10,
    topic_id,
  });

  const { data: topicsData } = useGetQuery<TopicsListResponse, TopicsReadProps>(
    {
      queryKey: [{ [QueryKey.topics]: topic_id }],
    },
    adminTopicsGet,
    pagination
  );

  const { data: threadSettingsData } = useGetQuery<
    thread_setting,
    GeneralReadProps
  >(
    {
      queryKey: [QueryKey.threadSettings],
    },
    adminThreadGeneralSettingsGet
  );

  const router = useRouter();

  const methods = useForm<TopicWithPoint>({
    defaultValues: topicDefault(),
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => {
      if (topicsData?.topics?.length) {
        const topic = topicsData.topics.find((t) => t.id === topic_id);
        if (topic) {
          if (!methods.formState.isDirty) {
            methods.reset({
              ...topic,
            });
          }
        } else if (threadSettingsData) {
          const {
            max_thread_title_length,
            max_thread_content_length,
            max_thread_comment_length,
            min_thread_title_length,
            min_thread_content_length,
            min_thread_comment_length,
            level_read,
            level_create,
            level_comment,
            level_download,
            level_moderator,
            use_upload_file,
            allowed_file_extensions,
            max_file_size_mb,
            max_upload_items,
            use_thumbnail,
            use_anonymous,
            use_upvote,
            use_downvote,
            thread_page_size,
            thread_page_nav_size,
            points_per_post_create,
            points_per_post_read,
            points_per_comment_create,
            points_per_file_download,
            points_per_upvote,
            points_per_downvote,
            thread_disable_edit,
            thread_disable_delete,
          } = threadSettingsData;

          methods.reset({
            id: 0,
            display_order: 0,
            is_active: true,
            single_comment_only: false,
            show_quickmenu: false,
            preview_on_homepage: false,
            fullview_on_homepage: false,
            max_thread_title_length,
            max_thread_content_length,
            max_thread_comment_length,
            min_thread_title_length,
            min_thread_content_length,
            min_thread_comment_length,
            level_read,
            level_create,
            level_comment,
            level_download,
            level_moderator,
            use_upload_file,
            allowed_file_extensions,
            max_file_size_mb,
            max_upload_items,
            use_thumbnail,
            use_anonymous,
            use_upvote,
            use_downvote,
            thread_page_size,
            thread_page_nav_size,
            points_per_post_create,
            points_per_post_read,
            points_per_comment_create,
            points_per_file_download,
            points_per_upvote,
            points_per_downvote,
            thread_disable_edit,
            thread_disable_delete,
          });
        }
      } else if (threadSettingsData) {
        const {
          max_thread_title_length,
          max_thread_content_length,
          max_thread_comment_length,
          min_thread_title_length,
          min_thread_content_length,
          min_thread_comment_length,
          level_read,
          level_create,
          level_comment,
          level_download,
          level_moderator,
          use_upload_file,
          allowed_file_extensions,
          max_file_size_mb,
          max_upload_items,
          use_thumbnail,
          use_anonymous,
          use_upvote,
          use_downvote,
          thread_page_size,
          thread_page_nav_size,
          points_per_post_create,
          points_per_post_read,
          points_per_comment_create,
          points_per_file_download,
          points_per_upvote,
          points_per_downvote,
          thread_disable_edit,
          thread_disable_delete,
        } = threadSettingsData;

        methods.reset({
          id: 0,
          display_order: 0,
          is_active: true,
          single_comment_only: false,
          show_quickmenu: false,
          preview_on_homepage: false,
          fullview_on_homepage: false,
          max_thread_title_length,
          max_thread_content_length,
          max_thread_comment_length,
          min_thread_title_length,
          min_thread_content_length,
          min_thread_comment_length,
          level_read,
          level_create,
          level_comment,
          level_download,
          level_moderator,
          use_upload_file,
          allowed_file_extensions,
          max_file_size_mb,
          max_upload_items,
          use_thumbnail,
          use_anonymous,
          use_upvote,
          use_downvote,
          thread_page_size,
          thread_page_nav_size,
          points_per_post_create,
          points_per_post_read,
          points_per_comment_create,
          points_per_file_download,
          points_per_upvote,
          points_per_downvote,
          thread_disable_edit,
          thread_disable_delete,
        });
      }
    },
    dependency: [topicsData, topic_id],
  });

  const goBackList = () => {
    router.push(AdminAppRoute.Boards);
  };
  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const submit = async (props: TopicWithPoint) => {
    setLoading();
    cleanFormData(props, {
      keysToNumber: [
        "id",
        "display_order",
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
      const { isSuccess, hasMessage } = await postJson<topicsUpdateProps>(
        ApiRoute.adminTopicsUpdate,
        props
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(props);
        refreshCache(queryClient, QueryKey.topics);
        goBackList();
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
    topicsData,
    threadSettingsData,
    goBackList,
    submit,
  };
};
