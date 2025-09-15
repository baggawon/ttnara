"use client";

import type { partner } from "@prisma/client";
import type {
  PartnersListResponse,
  PartnersReadProps,
} from "@/app/api/admin_di2u3k2j/partners/read";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminPartnersGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";
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

export interface AdminPartnersMethods {
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

const deletePartners = async (ids: number[]) => {
  const result = await postJson(ApiRoute.adminPartnersDelete, { ids });
  if (!result.isSuccess) {
    throw new Error("Failed to delete partners");
  }
  return result;
};

export const useAdminPartnersListHook = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<partner | null>(null);

  const [pagination, setPagination] = useState<PartnersReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: partnersData, status } = useGetQuery<
    PartnersListResponse,
    PartnersReadProps
  >(
    {
      queryKey: [{ [QueryKey.partners]: pagination }],
    },
    adminPartnersGet,
    pagination
  );

  const isLoading = status === "pending" || partnersData === null;
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();
  const deletePartnersMutation = useMutation({
    mutationFn: deletePartners,
    onSuccess: () => {
      toast({
        id: ToastData.partnerDelete,
        type: "success",
      });
      setSelectedIds([]);
      refreshCache(queryClient, QueryKey.partners);
    },
    onError: (error: Error) => {
      toast({
        id: ToastData.partnerDeleteFailed,
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
      const allIds = partnersData?.partners?.map((p) => p.id) || [];
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

  const handleEdit = (partner: partner) => {
    setEditingPartner(partner);
    setIsEditSheetOpen(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast({
        id: ToastData.partnerDeleteFailed,
        type: "error",
      });
      return;
    }

    if (confirm(`Delete ${selectedIds.length} selected item(s)?`)) {
      deletePartnersMutation.mutate(selectedIds);
    }
  };

  const allSelected = useMemo(() => {
    const partners = partnersData?.partners ?? [];
    return (
      partners.length > 0 && partners.every((p) => selectedIds.includes(p.id))
    );
  }, [selectedIds, partnersData?.partners]);

  const someSelected = useMemo(() => {
    return selectedIds.length > 0 && !allSelected;
  }, [selectedIds.length, allSelected]);

  const columns: CustomColumDef<partner>[] = setDefaultColumn([
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
      accessorKey: "name",
      headerTitle: "이름",
      headerClassName: "!min-w-[120px]",
    },
    {
      accessorKey: "url",
      headerTitle: "URL",
      headerClassName: "!min-w-[200px]",
      cell: (props) => (
        <a
          href={props.getValue() as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate block max-w-[200px]"
        >
          {props.getValue() as string}
        </a>
      ),
    },
    {
      accessorKey: "public_banner_image_url",
      headerTitle: "배너 이미지",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: (props) => {
        const imageUrl = props.getValue() as string;
        return imageUrl ? (
          <Image
            src={`https://` + imageUrl}
            alt="Banner"
            className="w-12 h-12 object-cover rounded"
            width={48}
            height={48}
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
            No Banner
          </div>
        );
      },
    },
    {
      accessorKey: "public_partner_image_url",
      headerTitle: "파트너 이미지",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: (props) => {
        const imageUrl = props.getValue() as string;
        return imageUrl ? (
          <Image
            src={`https://` + imageUrl}
            alt="Partner"
            className="w-12 h-12 object-cover rounded"
            width={48}
            height={48}
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
            No Partner
          </div>
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
        const rowPartner = row.original as partner;
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleEdit(rowPartner)}
          >
            수정
          </Button>
        );
      },
    },
  ]);

  const methods = useForm<AdminPartnersMethods>({
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
    partnersData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingPartner,
    updatePagination,
    handleDelete,
    deletePartnersMutation,
  };
};
