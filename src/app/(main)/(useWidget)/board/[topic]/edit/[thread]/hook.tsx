"use client";

import type { ThreadWithProfile } from "@/app/api/threads/read";
import type { TopicSettings } from "@/app/api/topic/read";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { postFormData, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { threadDefault } from "@/helpers/defaultValue";
import { attachedMediaGet, threadGet, topicSettingsGet } from "@/helpers/get";
import type { MediaUploadResult } from "@/app/api/uploads/media";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import { stripCloudFrontSignaturesClient } from "@/helpers/uploadUtil";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
// import useBoardAccessControl from "@/helpers/customHook/useBoardAccessContol";

export const useThreadsEditHook = (topic_url: string, thread_id: number) => {
  const { data: sessionData } = useSession();
  const { data: topicSettings } = useGetQuery<
    TopicSettings, // New type needed
    { topic_url: string }
  >(
    {
      queryKey: [{ [QueryKey.topicSettings]: { topic_url } }],
      staleTime: Infinity,
    },
    topicSettingsGet, // New API endpoint needed
    { topic_url }
  );

  // Get specific thread if editing
  const { data: currentThread } = useGetQuery<
    ThreadWithProfile,
    { topic_url: string; thread_id: number }
  >(
    {
      queryKey: [{ [QueryKey.thread]: { topic_url, thread_id } }],
      staleTime: Infinity,
      enabled: thread_id > 0,
    },
    threadGet,
    { topic_url, thread_id }
  );

  const { data: attachedMedia } = useGetQuery<
    MediaUploadResult[],
    { attached_to_type: string; attached_to_id: number }
  >(
    {
      queryKey: [
        { [QueryKey.attachedMedia]: { type: "thread", id: thread_id } },
      ],
      staleTime: Infinity,
      enabled: thread_id > 0,
    },
    attachedMediaGet,
    { attached_to_type: "thread", attached_to_id: thread_id }
  );

  // const accessControl = useBoardAccessControl({ topicSettings, currentThread });
  // const canWrite = accessControl?.permissions.canWrite;
  // const canEdit = accessControl?.permissions.canEdit;

  const router = useRouter();

  // if (thread_id === 0 && !canWrite) {
  //   redirect(AppRoute.Main);
  // } else if (thread_id > 0 && !canEdit) {
  //   redirect(AppRoute.Main);
  // }

  const methods = useForm<ThreadWithProfile>({
    defaultValues: threadDefault({ id: thread_id }),
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => {
      if (currentThread) {
        methods.reset({
          ...currentThread,
          content: stripCloudFrontSignaturesClient(currentThread.content ?? ""),
        });
      }

      if (topicSettings?.id) {
        methods.setValue("topic_id", topicSettings.id);
        if (topicSettings.use_anonymous) {
          const canModerate =
            !!sessionData?.user?.is_app_admin ||
            (sessionData?.user?.auth_level ?? 0) >=
              (topicSettings.level_moderator ?? 0);
          // 익명 필수 토픽에서는 모더레이터/관리자가 아니면 is_secret 항상 true
          if (!canModerate) {
            methods.setValue("is_secret", true);
          } else if (thread_id === 0) {
            // 신규 글 작성 시 기본값은 익명
            methods.setValue("is_secret", true);
          }
        }
      }
    },
    dependency: [currentThread, topicSettings, sessionData],
  });

  const goBackList = () => {
    router.push(`${AppRoute.Threads}/${topic_url}`);
  };
  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const submit = async (props: ThreadWithProfile) => {
    // Only check for currentThread if we're editing an existing thread
    if (props.id !== 0 && !currentThread) {
      return;
    }

    // Ensure we have topicSettings before proceeding
    if (!topicSettings?.id) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
      return;
    }

    // Ensure topic_id is set correctly
    if (props.id === 0) {
      props.topic_id = topicSettings.id;
    }

    setLoading();

    forEach(["category_id"], (key) => {
      if (
        (props as any)[key] === "" ||
        (props as any)[key] === undefined ||
        (props as any)[key] === -1
      ) {
        (props as any)[key] = null;
      } else if ((props as any)[key] !== null) {
        (props as any)[key] = Number((props as any)[key]);
      }
    });

    forEach(
      ["topic_id", "topic_order", "views", "upvotes", "downvotes"],
      (key) => {
        (props as any)[key] = Number((props as any)[key]);
      }
    );

    if (props.author) {
      props.author = null;
    }

    const formData = new FormData();
    formData.append("json", JSON.stringify(props));
    formData.append("topic_url", topic_url);

    try {
      const { isSuccess, hasMessage } = await postFormData(
        ApiRoute.threadsUpdate,
        formData
      );

      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(threadDefault());
        refreshCache(queryClient, QueryKey.thread);
        refreshCache(queryClient, QueryKey.threads);
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
    topicSettings,
    attachedMedia,
    goBackList,
    submit,
  };
};
