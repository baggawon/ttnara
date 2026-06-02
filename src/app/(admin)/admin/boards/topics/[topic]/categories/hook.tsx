"use client";

import type { category } from "@prisma/client";
import type { topicCategoriesDeleteProps } from "@/app/api/admin_di2u3k2j/topics/categories/delete";
import type { topicCategoriesUpdateProps } from "@/app/api/admin_di2u3k2j/topics/categories/update";
import type {
  TopicCategoriesListResponse,
  TopicCategoriesReadProps,
} from "@/app/api/admin_di2u3k2j/topics/categories/read";
import type {
  TopicsListResponse,
  TopicsReadProps,
  TopicWithPoint,
} from "@/app/api/admin_di2u3k2j/topics/read";
import CascadeDeleteDialog from "@/components/1_atoms/CascadeDeleteDialog";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminTopicCategoriesGet, adminTopicsGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useState } from "react";
import { useForm } from "react-hook-form";

export interface AdminBoardsTopicsMethods {
  page: string;
  pageSize: string;
  order: string;
  search: string;
  editTopicData?: TopicWithPoint;
}

export const useAdminTopicCategoriesHook = (topic_id: number) => {
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

  const [pagination, setPagination] = useState<TopicCategoriesReadProps>({
    page: 1,
    pageSize: 10,
    topic_id,
  });

  const { data: categoriesData } = useGetQuery<
    TopicCategoriesListResponse,
    TopicCategoriesReadProps
  >(
    {
      queryKey: [{ [`${QueryKey.topics}${QueryKey.categories}`]: pagination }],
    },
    adminTopicCategoriesGet,
    pagination,
    { silent: true }
  );

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps = {
      page: Number(prevProps.page),
      pageSize: Number(prevProps.pageSize),
      order: prevProps.order === "asc" ? ("asc" as "asc" | "desc") : undefined,
      search: prevProps.search === "" ? undefined : prevProps.search,
      topic_id,
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete (newProps as any)[key];
    });
    setPagination(newProps);
  };

  // Add/edit happen in an in-page sheet modal rather than a separate route.
  // `editingCategory` is null for create, a row for edit.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<category | null>(null);

  // Home card-type boards sync their categories from an external source, so the
  // admin must not edit/add/delete them by hand.
  const isHomeCardBoard =
    topicsData?.topics?.[0]?.fullview_on_homepage === true;

  const columns: CustomColumDef<category>[] = setDefaultColumn([
    {
      accessorKey: "name",
      headerTitle: "이름",
      headerClassName: "!w-[20%]",
      cellClassName: "!w-[20%]",
    },
    {
      accessorKey: "description",
      headerTitle: "설명",
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
              disabled={isHomeCardBoard}
              onClick={() => openEdit(props.row.index)}
            >
              수정
            </Button>

            {isHomeCardBoard ? (
              <Button
                type="button"
                className="!p-2 !h-fit"
                variant="outline"
                disabled
              >
                삭제
              </Button>
            ) : (
              <CascadeDeleteDialog
                itemLabel="카테고리"
                itemName={categoriesData?.categories[props.row.index].name ?? ""}
                cascadeDescription={
                  "이 카테고리를 삭제하면 하위 게시글, 댓글, 추천까지 모두 영구 삭제되며 복구할 수 없습니다.\n비활성화를 권장합니다."
                }
                deactivateDisabled={
                  !categoriesData?.categories[props.row.index].is_active
                }
                onDeactivate={() => deactivateCategory(props.row.index)}
                onDelete={() => deleteCategory(props.row.index)}
              >
                <Button type="button" className="!p-2 !h-fit" variant="outline">
                  삭제
                </Button>
              </CascadeDeleteDialog>
            )}
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

  const deleteCategory = async (index: number) => {
    if (!categoriesData) return;
    if (isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } =
        await postJson<topicCategoriesDeleteProps>(
          ApiRoute.adminTopicCategoriesDelete,
          { deleteCategoryId: categoriesData.categories[index].id }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess)
        refreshCache(queryClient, `${QueryKey.topics}${QueryKey.categories}`);
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    setIsWorking(false);
  };

  const deactivateCategory = async (index: number) => {
    if (!categoriesData) return;
    if (isWorking) return;
    setIsWorking(true);
    try {
      const category = categoriesData.categories[index];
      const { isSuccess, hasMessage } =
        await postJson<topicCategoriesUpdateProps>(
          ApiRoute.adminTopicCategoriesUpdate,
          { ...category, is_active: false }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess)
        refreshCache(queryClient, `${QueryKey.topics}${QueryKey.categories}`);
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsWorking(false);
  };

  const newCreateTopic = () => {
    setEditingCategory(null);
    setSheetOpen(true);
  };

  const openEdit = (index: number) => {
    if (!categoriesData) return;
    setEditingCategory(categoriesData.categories[index]);
    setSheetOpen(true);
  };

  const onCategorySaved = () => {
    refreshCache(queryClient, `${QueryKey.topics}${QueryKey.categories}`);
  };

  return {
    columns,
    methods,
    updatePagination,
    topicsData,
    categoriesData,
    newCreateTopic,
    isWorking,
    isHomeCardBoard,
    topic_id,
    sheetOpen,
    setSheetOpen,
    editingCategory,
    openEdit,
    onCategorySaved,
  };
};
