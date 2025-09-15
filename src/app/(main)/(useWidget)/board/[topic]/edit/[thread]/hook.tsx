"use client";

import type { ThreadWithProfile } from "@/app/api/threads/read";
import type { TopicSettings } from "@/app/api/topic/read";
import { _tempVideoFiles } from "@/components/2_molecules/Input/CkeditorPlugins/VideoUploadPlugin";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { postFormData, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { threadDefault } from "@/helpers/defaultValue";
import { threadGet, topicSettingsGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import { extractMediaFromHtml } from "@/helpers/uploadUtil";
import { redirect, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
// import useBoardAccessControl from "@/helpers/customHook/useBoardAccessContol";

export const useThreadsEditHook = (topic_url: string, thread_id: number) => {
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
      if (currentThread) methods.reset(currentThread);

      if (topicSettings?.id) {
        methods.setValue("topic_id", topicSettings.id);
      }
    },
    dependency: [currentThread, topicSettings],
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

    // extractImagesFromHtml 대신 새로운 함수 사용
    const { formData, modifiedHtml } = extractMediaFromHtml(props.content!);
    props.content = modifiedHtml;

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

    formData.append("json", JSON.stringify(props));
    formData.append("topic_url", topic_url);

    // 미디어 파일 삭제 처리
    if (props.id !== 0 && currentThread) {
      const oldMedia = currentThread.images;

      // 새 콘텐츠에 있는 미디어 URL 추출
      const newMediaUrls = extractMediaFromHtml(props.content!);

      // 삭제해야 할 미디어 찾기
      const toDelete = oldMedia.filter(
        (media) =>
          !newMediaUrls.modifiedHtml.includes(media.aws_cloud_front_url)
      );

      if (toDelete.length > 0) {
        formData.append("toDelete", JSON.stringify(toDelete));
      }
    }

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
        // 이미지 키 찾아서 삭제
        Object.keys(_tempVideoFiles).forEach((key) => {
          delete _tempVideoFiles[key];
        });
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
    goBackList,
    submit,
  };
};
