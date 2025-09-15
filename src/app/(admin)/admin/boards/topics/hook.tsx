"use client";

import type { topicsDeleteProps } from "@/app/api/admin_di2u3k2j/topics/delete";
import type {
  TopicsListResponse,
  TopicsReadProps,
  TopicWithPoint,
} from "@/app/api/admin_di2u3k2j/topics/read";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminTopicsGet } from "@/helpers/get";
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
    pagination
  );

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
      headerClassName: "!w-[20%]",
      cellClassName: "!w-[20%]",
    },
    {
      accessorKey: "url",
      headerTitle: "URL",
      headerClassName: "!w-[20%]",
      cellClassName: "!w-[20%]",
    },
    {
      accessorKey: "display_order",
      headerTitle: "순서",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
    },
    {
      accessorKey: "is_active",
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
      headerTitle: "활성화",
      convertValue: (value) => (value ? "활성" : "비활성"),
    },
    {
      accessorKey: "control",
      headerClassName: "!max-w-[250px]",
      cellClassName: "!max-w-[250px] overflow-hidden",
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

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const deleteTopic = async (index: number) => {
    if (!topicsData) return;
    setLoading();
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
    disableLoading();
  };

  const newCreateTopic = () => {
    router.push(`${AdminAppRoute.Boards}/0`);
  };

  return {
    columns,
    methods,
    updatePagination,
    topicsData,
    newCreateTopic,
  };
};
