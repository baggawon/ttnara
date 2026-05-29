"use client";

import type { guarantee_company } from "@prisma/client";
import type {
  GuaranteeListResponse,
  GuaranteeReadProps,
} from "@/app/api/admin_di2u3k2j/guarantee/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminGuaranteeGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, GuaranteePositionLabel, QueryKey } from "@/helpers/types";
import type { GuaranteePosition } from "@/helpers/types";
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

export interface AdminGuaranteeMethods {
  page: string;
  pageSize: string;
  is_active: string;
  region: string;
  order: string;
  search: string;
}

type PaginationProps = {
  page: number;
  pageSize: number;
  is_active?: boolean;
  region?: string;
  order?: "asc" | "desc";
  search?: string;
};

const deleteItems = async (ids: number[]) => {
  const result = await postJson(ApiRoute.adminGuaranteeDelete, { ids });
  if (!result.isSuccess) {
    throw new Error("Failed to delete guarantee items");
  }
  return result;
};

export const useAdminGuaranteeListHook = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<guarantee_company | null>(
    null
  );

  const [pagination, setPagination] = useState<GuaranteeReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: listData, status } = useGetQuery<
    GuaranteeListResponse,
    GuaranteeReadProps
  >(
    {
      queryKey: [{ [QueryKey.guaranteeCompanies]: pagination }],
    },
    adminGuaranteeGet,
    pagination,
    { silent: true }
  );

  const isLoading = status === "pending" || listData === null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteItems,
    onSuccess: () => {
      toast({ id: ToastData.guaranteeDelete, type: "success" });
      setSelectedIds([]);
      refreshCache(queryClient, QueryKey.guaranteeCompanies);
    },
    onError: () => {
      toast({ id: ToastData.guaranteeDeleteFailed, type: "error" });
    },
  });

  const updatePagination = () => {
    const prev = methods.getValues();
    const next: PaginationProps = {
      page: Number(prev.page) || 1,
      pageSize: Number(prev.pageSize) || 10,
      is_active:
        prev.is_active === "all" ? undefined : getBoolean(prev.is_active),
      region: prev.region === "all" ? undefined : prev.region,
      order: prev.order === "asc" ? ("asc" as "asc" | "desc") : "desc",
      search: prev.search === "" ? undefined : prev.search,
    };

    forEach(Object.entries(next), ([key, value]) => {
      if (value === undefined) delete (next as any)[key];
    });
    setPagination(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = listData?.items?.map((p) => p.id) || [];
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleEdit = (item: guarantee_company) => {
    setEditingItem(item);
    setIsEditSheetOpen(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast({ id: ToastData.guaranteeDeleteFailed, type: "error" });
      return;
    }
    if (confirm(`선택된 ${selectedIds.length}개를 삭제할까요?`)) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const allSelected = useMemo(() => {
    const items = listData?.items ?? [];
    return items.length > 0 && items.every((p) => selectedIds.includes(p.id));
  }, [selectedIds, listData?.items]);

  const someSelected = useMemo(() => {
    return selectedIds.length > 0 && !allSelected;
  }, [selectedIds.length, allSelected]);

  const columns: CustomColumDef<guarantee_company>[] = setDefaultColumn([
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
      accessorKey: "public_image_url",
      headerTitle: "이미지",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: (props) => {
        const imageUrl = props.getValue() as string;
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt="Guarantee"
            className="w-14 h-14 object-cover rounded"
            width={56}
            height={56}
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-xs">
            없음
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      headerTitle: "Title",
      headerClassName: "!min-w-[140px]",
    },
    {
      accessorKey: "business_name",
      headerTitle: "업체명",
      headerClassName: "!min-w-[120px]",
    },
    {
      accessorKey: "regions",
      headerTitle: "지역",
      headerClassName: "!min-w-[140px]",
      cell: (props) => {
        const regions = (props.getValue() as string[]) ?? [];
        return <span>{regions.join(", ")}</span>;
      },
    },
    {
      accessorKey: "positions",
      headerTitle: "거래 포지션",
      headerClassName: "!min-w-[100px]",
      cell: (props) => {
        const positions = (props.getValue() as string[]) ?? [];
        return (
          <span>
            {positions
              .map(
                (p) =>
                  GuaranteePositionLabel[p as GuaranteePosition] ?? String(p)
              )
              .join(", ")}
          </span>
        );
      },
    },
    {
      accessorKey: "currencies",
      headerTitle: "취급",
      headerClassName: "!min-w-[120px]",
      cell: (props) => {
        const currencies = (props.getValue() as string[]) ?? [];
        return <span>{currencies.join(", ")}</span>;
      },
    },
    {
      accessorKey: "deposit",
      headerTitle: "보증금",
      headerClassName: "!min-w-[120px]",
    },
    {
      accessorKey: "description",
      headerTitle: "상세설명",
      headerClassName: "!min-w-[180px] !max-w-[260px]",
      cellClassName: "!min-w-[180px] !max-w-[260px]",
      cell: (props) => {
        const raw = (props.getValue() as string | null) ?? "";
        const text = raw
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (!text) {
          return <span className="text-muted-foreground">—</span>;
        }
        const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
        return (
          <span className="block truncate" title={text}>
            {preview}
          </span>
        );
      },
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
      convertValue: (value) => (value ? "Active" : "Inactive"),
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
      cell: ({ row }) => {
        const item = row.original as guarantee_company;
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleEdit(item)}
          >
            수정
          </Button>
        );
      },
    },
  ]);

  const methods = useForm<AdminGuaranteeMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
      is_active: "all",
      region: "all",
      order: "desc",
      search: "",
    },
    reValidateMode: "onSubmit",
  });

  return {
    columns,
    methods,
    listData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingItem,
    updatePagination,
    handleDelete,
    deleteMutation,
  };
};
