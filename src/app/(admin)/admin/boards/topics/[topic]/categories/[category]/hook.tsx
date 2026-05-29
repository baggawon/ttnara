"use client";

import type { category } from "@prisma/client";
import type {
  TopicCategoriesListResponse,
  TopicCategoriesReadProps,
} from "@/app/api/admin_di2u3k2j/topics/categories/read";
import type { topicCategoriesUpdateProps } from "@/app/api/admin_di2u3k2j/topics/categories/update";
import type {
  TopicsListResponse,
  TopicsReadProps,
  TopicWithPoint,
} from "@/app/api/admin_di2u3k2j/topics/read";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryDefault } from "@/helpers/defaultValue";
import { adminTopicCategoriesGet, adminTopicsGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export const useAdminTopicCategoriesEditHook = (
  topic_id: number,
  category_id: number
) => {
  const [topicPagination] = useState<TopicsReadProps>({
    page: 1,
    pageSize: 10,
    topic_id,
  });

  const { data: topicsData } = useGetQuery<TopicsListResponse, TopicsReadProps>(
    {
      queryKey: [{ [QueryKey.topics]: topic_id }],
    },
    adminTopicsGet,
    topicPagination,
    { silent: true }
  );

  const [pagination] = useState<TopicCategoriesReadProps>({
    page: 1,
    pageSize: 10,
    topic_id,
    category_id,
  });

  const { data: categoriesData } = useGetQuery<
    TopicCategoriesListResponse,
    TopicCategoriesReadProps
  >(
    {
      queryKey: [
        {
          [`${QueryKey.topics}${QueryKey.categories}`]: {
            [topic_id]: { category_id },
          },
        },
      ],
    },
    adminTopicCategoriesGet,
    pagination,
    { silent: true }
  );

  const router = useRouter();

  const methods = useForm<TopicWithPoint>({
    defaultValues: categoryDefault({ topic_id }),
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => {
      if (categoriesData) methods.reset(categoriesData.categories[0]);
    },
    dependency: [categoriesData],
  });

  const goBackList = () => {
    router.push(`${AdminAppRoute.Boards}/${topic_id}/categories`);
  };
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const editSaveMutation = useMutation({
    mutationFn: async (props: category) => {
      forEach(["topic_id", "description"], (key) => {
        if ((props as any)[key] === "" || (props as any)[key] === undefined) {
          (props as any)[key] = null;
        }
      });

      forEach(["display_order"], (key) => {
        (props as any)[key] = Number((props as any)[key]);
      });

      const { isSuccess, hasMessage } =
        await postJson<topicCategoriesUpdateProps>(
          ApiRoute.adminTopicCategoriesUpdate,
          props
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        refreshCache(queryClient, `${QueryKey.topics}${QueryKey.categories}`);
        goBackList();
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const editSave = (props: category) => {
    if (editSaveMutation.isPending) return;
    editSaveMutation.mutate(props);
  };

  return {
    methods,
    topicsData,
    categoriesData,
    goBackList,
    editSave,
    isSubmitting: editSaveMutation.isPending,
  };
};
