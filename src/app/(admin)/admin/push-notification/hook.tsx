"use client";

import type { push_template } from "@prisma/client";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import type {
  PushTemplateListResponse,
  PushTemplateReadProps,
} from "@/app/api/admin_di2u3k2j/push-notification/template/read";
import type {
  PushHistoryListResponse,
  PushHistoryReadProps,
  PushHistoryWithUser,
} from "@/app/api/admin_di2u3k2j/push-notification/history/read";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminPushTemplatesGet, adminPushHistoryGet } from "@/helpers/get";
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

// ─── Send Hook ───

export interface PushSendFormValues {
  title: string;
  body: string;
  url: string;
  category: string;
  template_id: number | null;
}

export const useAdminPushSendHook = () => {
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();

  const { data: templateListData } = useGetQuery<
    PushTemplateListResponse,
    PushTemplateReadProps
  >(
    {
      queryKey: [{ [QueryKey.pushTemplates]: { mode: "all" } }],
      staleTime: Infinity,
    },
    adminPushTemplatesGet,
    { mode: "all" }
  );

  const templates = templateListData?.templates ?? [];

  const methods = useForm<PushSendFormValues>({
    defaultValues: {
      title: "",
      body: "",
      url: "",
      category: "general",
      template_id: null,
    },
    reValidateMode: "onSubmit",
  });

  const loadTemplate = (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      methods.setValue("title", template.title);
      methods.setValue("body", template.body);
      methods.setValue("url", template.url ?? "");
      methods.setValue("category", template.category);
      methods.setValue("template_id", template.id);
    }
  };

  const clearForm = () => {
    methods.reset({
      title: "",
      body: "",
      url: "",
      category: "general",
      template_id: null,
    });
  };

  const handleSend = async () => {
    const values = methods.getValues();
    if (!values.title.trim() || !values.body.trim()) {
      toast({ id: ToastData.unknown, type: "error" });
      return;
    }

    if (!confirm("알림을 발송하시겠습니까?")) return;

    setIsSending(true);
    try {
      const { isSuccess, hasMessage, hasData } = await postJson(
        ApiRoute.adminPushSend,
        {
          title: values.title,
          body: values.body,
          url: values.url || undefined,
          category: values.category,
          template_id: values.template_id || undefined,
        }
      );

      if (hasMessage) {
        toast({
          id: hasMessage,
          type: isSuccess ? "success" : "error",
        });
      }

      if (isSuccess) {
        clearForm();
        refreshCache(queryClient, QueryKey.pushHistory);
      }
    } catch {
      toast({ id: ToastData.pushSendFailed, type: "error" });
    }
    setIsSending(false);
  };

  return {
    methods,
    templates,
    loadTemplate,
    clearForm,
    handleSend,
    isSending,
    showPreview,
    setShowPreview,
  };
};

// ─── Template Hook ───

export interface AdminTemplateMethods {
  page: string;
  pageSize: string;
  search: string;
}

const deleteTemplates = async (ids: number[]) => {
  const result = await postJson(ApiRoute.adminPushTemplateDelete, { ids });
  if (!result.isSuccess) throw new Error("Failed to delete templates");
  return result;
};

export const useAdminPushTemplateHook = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<push_template | null>(
    null
  );

  const [pagination, setPagination] = useState<PushTemplateReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: templateData, status } = useGetQuery<
    PushTemplateListResponse,
    PushTemplateReadProps
  >(
    {
      queryKey: [{ [QueryKey.pushTemplates]: pagination }],
    },
    adminPushTemplatesGet,
    pagination
  );

  const isLoading = status === "pending" || templateData === null;
  const { toast } = useToast();
  const { queryClient } = useLoadingHandler();

  const deleteTemplatesMutation = useMutation({
    mutationFn: deleteTemplates,
    onSuccess: (data) => {
      if (data?.hasMessage) {
        toast({ id: data.hasMessage, type: "success" });
      }
      setSelectedIds([]);
      refreshCache(queryClient, QueryKey.pushTemplates);
    },
    onError: () => {
      toast({ id: ToastData.pushTemplateDeleteFailed, type: "error" });
    },
  });

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps: any = {
      page: Number(prevProps.page) || 1,
      pageSize: Number(prevProps.pageSize) || 10,
      search: prevProps.search === "" ? undefined : prevProps.search,
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete newProps[key];
    });
    setPagination(newProps);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(templateData?.templates?.map((t) => t.id) ?? []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    }
  };

  const handleEdit = (template: push_template) => {
    setEditingTemplate(template);
    setIsEditSheetOpen(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast({ id: ToastData.unknown, type: "error" });
      return;
    }
    if (confirm(`${selectedIds.length}개의 템플릿을 삭제하시겠습니까?`)) {
      deleteTemplatesMutation.mutate(selectedIds);
    }
  };

  const allSelected = useMemo(() => {
    const templates = templateData?.templates ?? [];
    return (
      templates.length > 0 && templates.every((t) => selectedIds.includes(t.id))
    );
  }, [selectedIds, templateData?.templates]);

  const someSelected = useMemo(
    () => selectedIds.length > 0 && !allSelected,
    [selectedIds.length, allSelected]
  );

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      general: "일반",
      notice: "공지",
      event: "이벤트",
      update: "업데이트",
    };
    return labels[cat] ?? cat;
  };

  const columns: CustomColumDef<push_template>[] = setDefaultColumn([
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
      headerTitle: "템플릿 이름",
      headerClassName: "!min-w-[120px]",
    },
    {
      accessorKey: "title",
      headerTitle: "알림 제목",
      headerClassName: "!min-w-[150px]",
    },
    {
      accessorKey: "body",
      headerTitle: "내용",
      headerClassName: "!min-w-[200px]",
      cell: ({ row }) => (
        <span className="line-clamp-1">{row.original.body}</span>
      ),
    },
    {
      accessorKey: "category",
      headerTitle: "카테고리",
      headerClassName: "!max-w-[100px]",
      cellClassName: "!max-w-[100px]",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {categoryLabel(row.original.category)}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      headerTitle: "생성일",
      headerClassName: "!max-w-[120px]",
      cellClassName: "!max-w-[120px]",
      convertValue: (value) =>
        dayjs(value).tz("Asia/Seoul").format("MM-DD HH:mm"),
    },
    {
      accessorKey: "control",
      headerTitle: "작업",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleEdit(row.original)}
        >
          수정
        </Button>
      ),
    },
  ]);

  const methods = useForm<AdminTemplateMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
      search: "",
    },
    reValidateMode: "onSubmit",
  });

  return {
    columns,
    methods,
    templateData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingTemplate,
    updatePagination,
    handleDelete,
    deleteTemplatesMutation,
  };
};

// ─── History Hook ───

export interface AdminHistoryMethods {
  page: string;
  pageSize: string;
  search: string;
  from_date: string;
  to_date: string;
}

export const useAdminPushHistoryHook = () => {
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] =
    useState<PushHistoryWithUser | null>(null);

  const [pagination, setPagination] = useState<PushHistoryReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: historyData, status } = useGetQuery<
    PushHistoryListResponse,
    PushHistoryReadProps
  >(
    {
      queryKey: [{ [QueryKey.pushHistory]: pagination }],
    },
    adminPushHistoryGet,
    pagination
  );

  const isLoading = status === "pending" || historyData === null;

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps: any = {
      page: Number(prevProps.page) || 1,
      pageSize: Number(prevProps.pageSize) || 10,
      search: prevProps.search === "" ? undefined : prevProps.search,
      from_date: prevProps.from_date === "" ? undefined : prevProps.from_date,
      to_date: prevProps.to_date === "" ? undefined : prevProps.to_date,
    };
    forEach(Object.entries(newProps), ([key, value]) => {
      if (value === undefined) delete newProps[key];
    });
    setPagination(newProps);
  };

  const handleViewDetail = (history: PushHistoryWithUser) => {
    setSelectedHistory(history);
    setIsDetailSheetOpen(true);
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      general: "일반",
      notice: "공지",
      event: "이벤트",
      update: "업데이트",
    };
    return labels[cat] ?? cat;
  };

  const columns: CustomColumDef<PushHistoryWithUser>[] = setDefaultColumn([
    {
      accessorKey: "title",
      headerTitle: "제목",
      headerClassName: "!min-w-[150px]",
    },
    {
      accessorKey: "body",
      headerTitle: "내용",
      headerClassName: "!min-w-[200px]",
      cell: ({ row }) => (
        <span className="line-clamp-1">{row.original.body}</span>
      ),
    },
    {
      accessorKey: "category",
      headerTitle: "카테고리",
      headerClassName: "!max-w-[100px]",
      cellClassName: "!max-w-[100px]",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {categoryLabel(row.original.category)}
        </Badge>
      ),
    },
    {
      accessorKey: "recipient_count",
      headerTitle: "발송 수",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      convertValue: (value) => `${value}명`,
    },
    {
      accessorKey: "sent_by",
      headerTitle: "발송자",
      headerClassName: "!max-w-[100px]",
      cellClassName: "!max-w-[100px]",
      cell: ({ row }) => (
        <span>{row.original.user?.profile?.displayname ?? "-"}</span>
      ),
    },
    {
      accessorKey: "sent_at",
      headerTitle: "발송일시",
      headerClassName: "!max-w-[120px]",
      cellClassName: "!max-w-[120px]",
      convertValue: (value) =>
        dayjs(value).tz("Asia/Seoul").format("MM-DD HH:mm"),
    },
    {
      accessorKey: "control",
      headerTitle: "상세",
      headerClassName: "!max-w-[80px]",
      cellClassName: "!max-w-[80px]",
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleViewDetail(row.original as PushHistoryWithUser)}
        >
          상세
        </Button>
      ),
    },
  ]);

  const methods = useForm<AdminHistoryMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
      search: "",
      from_date: "",
      to_date: "",
    },
    reValidateMode: "onSubmit",
  });

  return {
    columns,
    methods,
    historyData,
    isLoading,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    selectedHistory,
    updatePagination,
  };
};
