"use client";

import type { support_link_card } from "@prisma/client";
import type {
  SupportLinkCardsListResponse,
  SupportLinkCardsReadProps,
} from "@/app/api/admin_di2u3k2j/support/link-cards/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminSupportLinkCardsGet } from "@/helpers/get";
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

export interface AdminSupportLinkCardsMethods {
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

const deleteLinkCards = async (ids: number[]) => {
  const result = await postJson(ApiRoute.adminSupportLinkCardsDelete, { ids });
  if (!result.isSuccess) {
    throw new Error("Failed to delete link cards");
  }
  return result;
};

export const useAdminSupportLinkCardsHook = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<support_link_card | null>(
    null
  );

  const [pagination, setPagination] = useState<SupportLinkCardsReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: cardsData, status } = useGetQuery<
    SupportLinkCardsListResponse,
    SupportLinkCardsReadProps
  >(
    {
      queryKey: [{ [QueryKey.adminSupportLinkCards]: pagination }],
    },
    adminSupportLinkCardsGet,
    pagination,
    { silent: true }
  );

  const isLoading = status === "pending" || cardsData === null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteLinkCards,
    onSuccess: (data) => {
      toast({
        id: data?.hasMessage ?? ToastData.supportLinkCardDelete,
        type: "success",
      });
      setSelectedIds([]);
      refreshCache(queryClient, QueryKey.adminSupportLinkCards);
    },
    onError: () => {
      toast({
        id: ToastData.supportLinkCardDeleteFailed,
        type: "error",
      });
    },
  });

  const methods = useForm<AdminSupportLinkCardsMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
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
      pageSize: Number(prev.pageSize) || 10,
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
      const allIds = cardsData?.cards?.map((c) => c.id) || [];
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleEdit = (card: support_link_card) => {
    setEditingCard(card);
    setIsEditSheetOpen(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast({ id: ToastData.supportLinkCardDeleteFailed, type: "error" });
      return;
    }
    if (confirm(`선택한 ${selectedIds.length}개의 카드를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const allSelected = useMemo(() => {
    const cards = cardsData?.cards ?? [];
    return cards.length > 0 && cards.every((c) => selectedIds.includes(c.id));
  }, [selectedIds, cardsData?.cards]);

  const someSelected = useMemo(() => {
    return selectedIds.length > 0 && !allSelected;
  }, [selectedIds.length, allSelected]);

  const columns: CustomColumDef<support_link_card>[] = setDefaultColumn([
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
      accessorKey: "cloudfront_url",
      headerTitle: "아이콘",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: (props) => {
        const iconUrl = props.getValue() as string | null;
        return iconUrl ? (
          <Image
            src={iconUrl}
            alt="Icon"
            className="w-12 h-12 object-cover rounded border"
            width={48}
            height={48}
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            없음
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      headerTitle: "제목",
      headerClassName: "!min-w-[140px]",
    },
    {
      accessorKey: "description",
      headerTitle: "설명",
      headerClassName: "!min-w-[200px]",
      cell: (props) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {(props.getValue() as string | null) ?? ""}
        </span>
      ),
    },
    {
      accessorKey: "url",
      headerTitle: "URL",
      headerClassName: "!min-w-[180px]",
      cell: (props) => (
        <span className="text-xs text-blue-600 break-all line-clamp-1">
          {props.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "opens_in_new_tab",
      headerTitle: "새 창",
      headerClassName: "!max-w-[60px]",
      cellClassName: "!max-w-[60px]",
      convertValue: (value) => (value ? "예" : "아니오"),
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
          onClick={() => handleEdit(row.original as support_link_card)}
        >
          수정
        </Button>
      ),
    },
  ]);

  return {
    columns,
    methods,
    cardsData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingCard,
    updatePagination,
    handleDelete,
    deleteMutation,
  };
};
