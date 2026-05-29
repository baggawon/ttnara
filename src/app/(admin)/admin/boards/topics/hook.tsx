"use client";

import type { topicsDeleteProps } from "@/app/api/admin_di2u3k2j/topics/delete";
import type {
  TopicsListResponse,
  TopicsReadProps,
  TopicWithPoint,
} from "@/app/api/admin_di2u3k2j/topics/read";
import type { topicsUpdateProps } from "@/app/api/admin_di2u3k2j/topics/update";
import type { BoardPreviewResponse } from "@/app/api/board-preview/read";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminTopicsGet, boardPreviewGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export interface AdminBoardsTopicsMethods {
  page: string;
  pageSize: string;
  order: string;
  search: string;
  editTopicData?: TopicWithPoint;
}

export const useAdminTopicsHook = () => {
  const [pagination, setPagination] = useState<TopicsReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: topicsData } = useGetQuery<TopicsListResponse, TopicsReadProps>(
    {
      queryKey: [{ [QueryKey.topics]: pagination }],
    },
    adminTopicsGet,
    pagination,
    { silent: true }
  );

  const { data: previewData } = useGetQuery<
    BoardPreviewResponse | null,
    undefined
  >({ queryKey: [QueryKey.boardPreview] }, boardPreviewGet, undefined, {
    silent: true,
  });

  const previewCount = previewData?.topics?.length ?? 0;

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps = {
      page: Number(prevProps.page),
      pageSize: Number(prevProps.pageSize),
      order: prevProps.order === "asc" ? ("asc" as "asc" | "desc") : undefined,
      search: prevProps.search === "" ? undefined : prevProps.search,
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete (newProps as any)[key];
    });
    setPagination(newProps);
  };

  const router = useRouter();

  const columns: CustomColumDef<TopicWithPoint>[] = setDefaultColumn([
    {
      accessorKey: "name",
      headerTitle: "이름",
      headerClassName: "!w-auto",
      cellClassName: "!w-auto",
    },
    {
      accessorKey: "url",
      headerTitle: "URL",
      headerClassName: "!w-auto",
      cellClassName: "!w-auto",
    },
    {
      accessorKey: "display_order",
      headerTitle: "순서",
      headerClassName: "!w-[60px]",
      cellClassName: "!w-[60px]",
    },
    {
      accessorKey: "is_active",
      headerClassName: "!w-[64px]",
      cellClassName: "!w-[64px]",
      headerTitle: "활성화",
      convertValue: (value) => (value ? "활성" : "비활성"),
    },
    {
      accessorKey: "preview_on_homepage",
      headerTitle: "미리보기",
      headerClassName: "!w-[80px]",
      cellClassName: "!w-[80px]",
      cell: (props) => {
        const topic = topicsData?.topics[props.row.index];
        if (!topic) return null;
        return (
          <Button
            type="button"
            className="!p-2 !h-fit"
            variant={topic.preview_on_homepage ? "default" : "outline"}
            disabled={!topic.is_active}
            onClick={() => togglePreview(props.row.index)}
          >
            {topic.preview_on_homepage ? "ON" : "OFF"}
          </Button>
        );
      },
    },
    {
      accessorKey: "fullview_on_homepage",
      headerTitle: "카드형 홈",
      headerClassName: "!w-[90px]",
      cellClassName: "!w-[90px]",
      cell: (props) => {
        const topic = topicsData?.topics[props.row.index];
        if (!topic) return null;
        return (
          <Button
            type="button"
            className="!p-2 !h-fit"
            variant={topic.fullview_on_homepage ? "default" : "outline"}
            disabled={!topic.is_active}
            onClick={() => toggleFullview(props.row.index)}
          >
            {topic.fullview_on_homepage ? "ON" : "OFF"}
          </Button>
        );
      },
    },
    {
      accessorKey: "control",
      headerClassName: "!w-[260px]",
      cellClassName: "!w-[260px]",
      headerTitle: "수정",
      cell: (props) => {
        return (
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              className="!p-2 !h-fit"
              onClick={() =>
                router.push(
                  `${AdminAppRoute.Boards}/${topicsData?.topics[props.row.index].id}`
                )
              }
            >
              수정
            </Button>

            <Button
              type="button"
              className="!p-2 !h-fit"
              onClick={() =>
                router.push(
                  `${AdminAppRoute.Boards}/${topicsData?.topics[props.row.index].id}/categories`
                )
              }
              variant="outline"
            >
              카테고리 관리
            </Button>
            <ConfirmDialog
              title="게시판 삭제"
              description="게시판을 삭제하시려면 확인을 눌러주세요."
              onConfirm={() => deleteTopic(props.row.index)}
            >
              <Button type="button" className="!p-2 !h-fit" variant="outline">
                삭제
              </Button>
            </ConfirmDialog>
          </div>
        );
      },
    },
  ]);

  const methods = useForm<AdminBoardsTopicsMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
      order: "desc",
      search: "",
    },
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const queryClient = useQueryClient();
  const [isWorking, setIsWorking] = useState(false);

  const deleteTopic = async (index: number) => {
    if (!topicsData) return;
    if (isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson<topicsDeleteProps>(
        ApiRoute.adminTopicsDelete,
        { deleteTopicId: topicsData.topics[index].id }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) refreshCache(queryClient, QueryKey.topics);
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    setIsWorking(false);
  };

  const togglePreview = async (index: number) => {
    if (!topicsData) return;
    const topic = topicsData.topics[index];

    if (!topic.preview_on_homepage && previewCount >= 2) {
      toast({
        id: "미리보기는 최대 2개까지 설정할 수 있습니다",
        type: "error",
      });
      return;
    }

    if (isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson<topicsUpdateProps>(
        ApiRoute.adminTopicsUpdate,
        {
          ...topic,
          preview_on_homepage: !topic.preview_on_homepage,
        }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.topics);
        refreshCache(queryClient, QueryKey.boardPreview);
      }
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsWorking(false);
  };

  const newCreateTopic = () => {
    router.push(`${AdminAppRoute.Boards}/0`);
  };

  const toggleFullview = async (index: number) => {
    if (!topicsData) return;
    const topic = topicsData.topics[index];

    if (isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson<topicsUpdateProps>(
        ApiRoute.adminTopicsUpdate,
        {
          ...topic,
          fullview_on_homepage: !topic.fullview_on_homepage,
        }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.topics);
      }
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsWorking(false);
  };

  return {
    columns,
    methods,
    updatePagination,
    topicsData,
    newCreateTopic,
    togglePreview,
    toggleFullview,
    deleteTopic,
    isWorking,
  };
};
