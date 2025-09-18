"use client";

import type { popup } from "@prisma/client";
import type {
  PopupListResponse,
  PopupReadProps,
} from "@/app/api/admin_di2u3k2j/popup/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminPopupsGet } from "@/helpers/get";
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

export interface AdminPopupMethods {
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

const deletePopups = async (ids: number[]) => {
  const result = await postJson(ApiRoute.adminPopupDelete, { ids });
  if (!result.isSuccess) {
    throw new Error("Failed to delete popups");
  }
  return result;
};

export const useAdminPopupListHook = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<popup | null>(null);

  const [pagination, setPagination] = useState<PopupReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: popupData, status } = useGetQuery<
    PopupListResponse,
    PopupReadProps
  >(
    {
      queryKey: [{ [QueryKey.popups]: pagination }],
    },
    adminPopupsGet,
    pagination
  );

  const isLoading = status === "pending" || popupData === null;
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();

  const deletePopupsMutation = useMutation({
    mutationFn: deletePopups,
    onSuccess: (data) => {
      if (data?.hasMessage) {
        toast({
          id: data.hasMessage,
          type: "success",
        });
      }
      setSelectedIds([]);
      refreshCache(queryClient, QueryKey.popups);
    },
    onError: (error: Error) => {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    },
  });

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps: PaginationProps = {
      page: Number(prevProps.page) || 1,
      pageSize: Number(prevProps.pageSize) || 10,
      is_active:
        prevProps.is_active === "all"
          ? undefined
          : getBoolean(prevProps.is_active),
      order: prevProps.order === "asc" ? ("asc" as "asc" | "desc") : "desc",
      search: prevProps.search === "" ? undefined : prevProps.search,
    };

    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete (newProps as any)[key];
    });
    setPagination(newProps);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = popupData?.popups?.map((p) => p.id) || [];
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

  const handleEdit = (popup: popup) => {
    setEditingPopup(popup);
    setIsEditSheetOpen(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
      return;
    }

    if (confirm(`${selectedIds.length}개의 팝업을 삭제하시겠습니까?`)) {
      deletePopupsMutation.mutate(selectedIds);
    }
  };

  const allSelected = useMemo(() => {
    const popups = popupData?.popups ?? [];
    return popups.length > 0 && popups.every((p) => selectedIds.includes(p.id));
  }, [selectedIds, popupData?.popups]);

  const someSelected = useMemo(() => {
    return selectedIds.length > 0 && !allSelected;
  }, [selectedIds.length, allSelected]);

  const columns: CustomColumDef<popup>[] = setDefaultColumn([
    {
      id: "select",
      header: ({ table }) => (
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
      accessorKey: "title",
      headerTitle: "제목",
      headerClassName: "!min-w-[150px]",
      cell: ({ row }) => {
        const popup = row.original;
        const now = new Date();
        const isExpired = new Date(popup.end_date) < now;
        const isNotStarted = new Date(popup.start_date) > now;

        return (
          <div className="flex items-center gap-2">
            <span>{popup.title}</span>
            {!popup.is_active && <Badge variant="secondary">비활성</Badge>}
            {isExpired && <Badge variant="destructive">만료</Badge>}
            {isNotStarted && <Badge variant="outline">대기중</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "position",
      headerTitle: "위치",
      headerClassName: "!max-w-[100px]",
      cellClassName: "!max-w-[100px]",
      convertValue: (value) => {
        const positions: Record<string, string> = {
          center: "중앙",
          "top-left": "상단 왼쪽",
          "top-right": "상단 오른쪽",
          "bottom-left": "하단 왼쪽",
          "bottom-right": "하단 오른쪽",
        };
        return positions[value as string] || value;
      },
    },
    {
      accessorKey: "start_date",
      headerTitle: "시작일",
      headerClassName: "!max-w-[120px]",
      cellClassName: "!max-w-[120px]",
      convertValue: (value) =>
        dayjs(value).tz("Asia/Seoul").format("MM-DD HH:mm"),
    },
    {
      accessorKey: "end_date",
      headerTitle: "종료일",
      headerClassName: "!max-w-[120px]",
      cellClassName: "!max-w-[120px]",
      convertValue: (value) =>
        dayjs(value).tz("Asia/Seoul").format("MM-DD HH:mm"),
    },
    {
      accessorKey: "device",
      headerTitle: "기기",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: ({ row }) => {
        const popup = row.original;
        const devices = [];
        if (popup.show_on_desktop) devices.push("PC");
        if (popup.show_on_mobile) devices.push("모바일");
        return <span className="text-xs">{devices.join(", ")}</span>;
      },
    },
    {
      accessorKey: "cookie_days",
      headerTitle: "쿠키",
      headerClassName: "!max-w-[60px]",
      cellClassName: "!max-w-[60px]",
      convertValue: (value) => `${value}일`,
    },
    {
      accessorKey: "display_order",
      headerTitle: "순서",
      headerClassName: "!max-w-[60px]",
      cellClassName: "!max-w-[60px]",
    },
    {
      accessorKey: "control",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      headerTitle: "작업",
      cell: ({ row }) => {
        const rowPopup = row.original as popup;
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleEdit(rowPopup)}
          >
            수정
          </Button>
        );
      },
    },
  ]);

  const methods = useForm<AdminPopupMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
      is_active: "all",
      order: "desc",
      search: "",
    },
    reValidateMode: "onSubmit",
  });

  return {
    columns,
    methods,
    popupData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingPopup,
    updatePagination,
    handleDelete,
    deletePopupsMutation,
  };
};
