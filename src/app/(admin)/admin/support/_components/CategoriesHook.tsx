"use client";

import type { support_qna_category } from "@prisma/client";
import type {
  SupportQnaCategoriesListResponse,
  SupportQnaCategoriesReadProps,
} from "@/app/api/admin_di2u3k2j/support/qna-categories/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminSupportQnaCategoriesGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { forEach, getBoolean } from "@/helpers/basic";

import { useMutation } from "@tanstack/react-query";
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

const deleteCategories = async (ids: number[]) => {
  const result = await postJson(ApiRoute.adminSupportQnaCategoriesDelete, {
    ids,
  });
  if (!result.isSuccess) {
    throw new Error("Failed to delete categories");
  }
  return result;
};

export const useAdminSupportQnaCategoriesHook = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
    pagination
  );

  const isLoading = status === "pending" || categoriesData === null;
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();

  const deleteMutation = useMutation({
    mutationFn: deleteCategories,
    onSuccess: (data) => {
      toast({
        id: data?.hasMessage ?? ToastData.supportQnaCategoryDelete,
        type: "success",
      });
      setSelectedIds([]);
      refreshCache(queryClient, QueryKey.adminSupportQnaCategories);
    },
    onError: () => {
      toast({
        id: ToastData.supportQnaCategoryDeleteFailed,
        type: "error",
      });
    },
  });

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = categoriesData?.categories?.map((c) => c.id) ?? [];
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((s) => s !== id));
  };

  const handleEdit = (cat: CategoryRow) => {
    setEditingCategory(cat);
    setIsEditSheetOpen(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast({ id: ToastData.supportQnaCategoryDeleteFailed, type: "error" });
      return;
    }
    const totalQnas =
      categoriesData?.categories
        ?.filter((c) => selectedIds.includes(c.id))
        .reduce((acc, c) => acc + (c._count?.qnas ?? 0), 0) ?? 0;
    const msg =
      totalQnas > 0
        ? `선택한 ${selectedIds.length}개 카테고리에 속한 ${totalQnas}개 QnA도 함께 삭제됩니다. 계속하시겠습니까?`
        : `선택한 ${selectedIds.length}개의 카테고리를 삭제하시겠습니까?`;
    if (confirm(msg)) deleteMutation.mutate(selectedIds);
  };

  const allSelected = useMemo(() => {
    const cats = categoriesData?.categories ?? [];
    return cats.length > 0 && cats.every((c) => selectedIds.includes(c.id));
  }, [selectedIds, categoriesData?.categories]);

  const someSelected = useMemo(
    () => selectedIds.length > 0 && !allSelected,
    [selectedIds.length, allSelected]
  );

  const columns: CustomColumDef<CategoryRow>[] = setDefaultColumn([
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.includes(row.original.id)}
          onCheckedChange={(checked) =>
            handleSelectItem(row.original.id, !!checked)
          }
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      headerClassName: "!max-w-[40px]",
      cellClassName: "!max-w-[40px]",
    },
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
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      headerTitle: "작업",
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleEdit(row.original as CategoryRow)}
        >
          수정
        </Button>
      ),
    },
  ]);

  return {
    columns,
    methods,
    categoriesData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingCategory,
    updatePagination,
    handleDelete,
    deleteMutation,
  };
};
