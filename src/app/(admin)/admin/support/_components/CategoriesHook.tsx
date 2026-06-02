"use client";

import type { support_qna_category } from "@prisma/client";
import type {
  SupportQnaCategoriesListResponse,
  SupportQnaCategoriesReadProps,
} from "@/app/api/admin_di2u3k2j/support/qna-categories/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

import CascadeDeleteDialog from "@/components/1_atoms/CascadeDeleteDialog";
import { Button } from "@/components/ui/button";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminSupportQnaCategoriesGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useState } from "react";
import { useForm } from "react-hook-form";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { forEach, getBoolean } from "@/helpers/basic";

import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

dayjs.extend(utc);
dayjs.extend(timezone);

export type CategoryRow = support_qna_category & { _count: { qnas: number } };

export interface AdminSupportQnaCategoriesMethods {
  page: string;
  pageSize: string;
  is_active: string;
  order: string;
  search: string;
}

type PaginationProps = {
  page: number;
  pageSize: number;
  is_active?: boolean;
  order?: "asc" | "desc";
  search?: string;
};

export const useAdminSupportQnaCategoriesHook = () => {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null
  );

  const [pagination, setPagination] = useState<SupportQnaCategoriesReadProps>({
    page: 1,
    pageSize: 20,
  });

  const { data: categoriesData, status } = useGetQuery<
    SupportQnaCategoriesListResponse,
    SupportQnaCategoriesReadProps
  >(
    { queryKey: [{ [QueryKey.adminSupportQnaCategories]: pagination }] },
    adminSupportQnaCategoriesGet,
    pagination,
    { silent: true }
  );

  const isLoading = status === "pending" || categoriesData === null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWorking, setIsWorking] = useState(false);

  const deactivateCategory = async (cat: CategoryRow) => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminSupportQnaCategoriesUpdate,
        {
          id: cat.id,
          name: cat.name,
          display_order: cat.display_order,
          is_active: false,
        }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess)
        refreshCache(queryClient, QueryKey.adminSupportQnaCategories);
    } catch (error) {
      toast({ id: ToastData.supportQnaCategoryUpdateFailed, type: "error" });
    }
    setIsWorking(false);
  };

  const deleteCategory = async (cat: CategoryRow) => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminSupportQnaCategoriesDelete,
        { ids: [cat.id] }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess)
        refreshCache(queryClient, QueryKey.adminSupportQnaCategories);
    } catch (error) {
      toast({ id: ToastData.supportQnaCategoryDeleteFailed, type: "error" });
    }
    setIsWorking(false);
  };

  const methods = useForm<AdminSupportQnaCategoriesMethods>({
    defaultValues: {
      page: "1",
      pageSize: "20",
      is_active: "all",
      order: "asc",
      search: "",
    },
    reValidateMode: "onSubmit",
  });

  const updatePagination = () => {
    const prev = methods.getValues();
    const next: PaginationProps = {
      page: Number(prev.page) || 1,
      pageSize: Number(prev.pageSize) || 20,
      is_active:
        prev.is_active === "all" ? undefined : getBoolean(prev.is_active),
      order: prev.order === "desc" ? "desc" : "asc",
      search: prev.search === "" ? undefined : prev.search,
    };
    forEach(Object.entries(next), ([key, value]) => {
      if (value === undefined) delete (next as any)[key];
    });
    setPagination(next);
  };

  const handleEdit = (cat: CategoryRow) => {
    setEditingCategory(cat);
    setIsEditSheetOpen(true);
  };

  const columns: CustomColumDef<CategoryRow>[] = setDefaultColumn([
    {
      accessorKey: "name",
      headerTitle: "이름",
      headerClassName: "!min-w-[200px]",
    },
    {
      id: "qna_count",
      headerTitle: "QnA 수",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: ({ row }) => row.original._count?.qnas ?? 0,
    },
    {
      accessorKey: "display_order",
      headerTitle: "순서",
      headerClassName: "!max-w-[60px]",
      cellClassName: "!max-w-[60px]",
    },
    {
      accessorKey: "is_active",
      headerTitle: "활성화",
      headerClassName: "!max-w-[60px]",
      cellClassName: "!max-w-[60px]",
      convertValue: (value) => (value ? "활성" : "비활성"),
    },
    {
      accessorKey: "created_at",
      headerTitle: "생성일",
      headerClassName: "!max-w-[100px]",
      cellClassName: "!max-w-[100px]",
      convertValue: (value) =>
        dayjs(value).tz("Asia/Seoul").format("YYYY-MM-DD"),
    },
    {
      accessorKey: "control",
      headerClassName: "!max-w-[140px]",
      cellClassName: "!max-w-[140px]",
      headerTitle: "작업",
      cell: ({ row }) => {
        const cat = row.original as CategoryRow;
        const qnaCount = cat._count?.qnas ?? 0;
        return (
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleEdit(cat)}
            >
              수정
            </Button>
            <CascadeDeleteDialog
              itemLabel="카테고리"
              itemName={cat.name}
              cascadeDescription={
                (qnaCount > 0
                  ? `이 카테고리를 삭제하면 소속된 ${qnaCount}개의 QnA도 함께 영구 삭제되며 복구할 수 없습니다.`
                  : "이 카테고리를 삭제하면 복구할 수 없습니다.") +
                "\n비활성화를 권장합니다."
              }
              deactivateDisabled={!cat.is_active}
              onDeactivate={() => deactivateCategory(cat)}
              onDelete={() => deleteCategory(cat)}
            >
              <Button type="button" size="sm" variant="outline">
                삭제
              </Button>
            </CascadeDeleteDialog>
          </div>
        );
      },
    },
  ]);

  return {
    columns,
    methods,
    categoriesData,
    isLoading,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingCategory,
    updatePagination,
  };
};
