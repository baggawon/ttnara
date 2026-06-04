"use client";

import type {
  SupportQnaListResponse,
  SupportQnaReadProps,
  SupportQnaWithCategory,
} from "@/app/api/admin_di2u3k2j/support/qna/read";
import type {
  SupportQnaCategoriesListResponse,
  SupportQnaCategoriesReadProps,
} from "@/app/api/admin_di2u3k2j/support/qna-categories/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import {
  adminSupportQnaCategoriesGet,
  adminSupportQnaGet,
} from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { forEach, getBoolean } from "@/helpers/basic";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface AdminSupportQnaMethods {
  page: string;
  pageSize: string;
  is_active: string;
  order: string;
  search: string;
  category_id: string;
}

type PaginationProps = {
  page: number;
  pageSize: number;
  is_active?: boolean;
  order?: "asc" | "desc";
  search?: string;
  category_id?: number;
};

const deleteQnas = async (ids: number[]) => {
  const result = await postJson(ApiRoute.adminSupportQnaDelete, { ids });
  if (!result.isSuccess) throw new Error("Failed to delete QnAs");
  return result;
};

export const useAdminSupportQnaHook = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingQnaId, setEditingQnaId] = useState<number | null>(null);

  const [pagination, setPagination] = useState<SupportQnaReadProps>({
    page: 1,
    pageSize: 20,
  });

  // Categories for the filter dropdown — fetch all active categories.
  // Key shape is `[QueryKey.x]` so refreshCache() in common.ts (which matches
  // `["x"]` exactly or `[{"x":...}]`) invalidates this when categories change.
  const { data: categoriesData } = useGetQuery<
    SupportQnaCategoriesListResponse,
    SupportQnaCategoriesReadProps
  >(
    { queryKey: [QueryKey.adminSupportQnaCategories] },
    adminSupportQnaCategoriesGet,
    { page: 1, pageSize: 200, is_active: true },
    { silent: true }
  );

  const { data: qnaData, status } = useGetQuery<
    SupportQnaListResponse,
    SupportQnaReadProps
  >(
    { queryKey: [{ [QueryKey.adminSupportQna]: pagination }] },
    adminSupportQnaGet,
    pagination,
    { silent: true }
  );

  const isLoading = status === "pending" || qnaData === null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteQnas,
    onSuccess: (data) => {
      toast({
        id: data?.hasMessage ?? ToastData.supportQnaDelete,
        type: "success",
      });
      setSelectedIds([]);
      refreshCache(queryClient, QueryKey.adminSupportQna);
    },
    onError: () => {
      toast({ id: ToastData.supportQnaDeleteFailed, type: "error" });
    },
  });

  const methods = useForm<AdminSupportQnaMethods>({
    defaultValues: {
      page: "1",
      pageSize: "20",
      is_active: "all",
      order: "asc",
      search: "",
      category_id: "all",
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
      category_id:
        prev.category_id === "all" ? undefined : Number(prev.category_id),
    };
    forEach(Object.entries(next), ([key, value]) => {
      if (value === undefined) delete (next as any)[key];
    });
    setPagination(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(qnaData?.qnas?.map((q) => q.id) ?? []);
    else setSelectedIds([]);
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((s) => s !== id));
  };

  const handleEdit = (id: number) => {
    setEditingQnaId(id);
    setSheetOpen(true);
  };

  const handleCreate = () => {
    setEditingQnaId(null);
    setSheetOpen(true);
  };

  const closeSheet = () => setSheetOpen(false);

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast({ id: ToastData.supportQnaDeleteFailed, type: "error" });
      return;
    }
    if (confirm(`선택한 ${selectedIds.length}개 QnA를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const allSelected = useMemo(() => {
    const qnas = qnaData?.qnas ?? [];
    return qnas.length > 0 && qnas.every((q) => selectedIds.includes(q.id));
  }, [selectedIds, qnaData?.qnas]);

  const someSelected = useMemo(
    () => selectedIds.length > 0 && !allSelected,
    [selectedIds.length, allSelected]
  );

  const columns: CustomColumDef<SupportQnaWithCategory>[] = setDefaultColumn([
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
      id: "category",
      headerTitle: "카테고리",
      headerClassName: "!max-w-[140px]",
      cellClassName: "!max-w-[140px]",
      cell: ({ row }) => row.original.category?.name ?? "-",
    },
    {
      accessorKey: "question",
      headerTitle: "질문",
      headerClassName: "!min-w-[260px]",
      cell: (props) => (
        <span className="text-sm line-clamp-2">
          {(props.getValue() as string) ?? ""}
        </span>
      ),
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
          onClick={() => handleEdit(row.original.id)}
        >
          수정
        </Button>
      ),
    },
  ]);

  return {
    columns,
    methods,
    qnaData,
    categoriesData,
    isLoading,
    selectedIds,
    updatePagination,
    handleCreate,
    handleDelete,
    deleteMutation,
    sheetOpen,
    editingQnaId,
    closeSheet,
  };
};
