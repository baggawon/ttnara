"use client";

import {
  useAdminPushSendHook,
  useAdminPushTemplateHook,
  useAdminPushHistoryHook,
} from "./hook";
import { DataTable } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { push_template } from "@prisma/client";
import { Send, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";

// ─── Template Sheet Form ───

const templateFormSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(100),
  title: z.string().min(1, "제목은 필수입니다").max(200),
  body: z.string().min(1, "내용은 필수입니다"),
  url: z.string().optional(),
  category: z.string().min(1),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateSheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  template?: push_template | null;
  isEdit?: boolean;
}

const TemplateSheetForm = ({
  isOpen,
  onClose,
  template,
  isEdit,
}: TemplateSheetFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      title: "",
      body: "",
      url: "",
      category: "general",
    },
  });

  const { register, handleSubmit, reset, formState, setValue, watch } = methods;

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && template) {
      reset({
        name: template.name,
        title: template.title,
        body: template.body,
        url: template.url ?? "",
        category: template.category,
      });
    } else {
      reset({
        name: "",
        title: "",
        body: "",
        url: "",
        category: "general",
      });
    }
  }, [isOpen, isEdit, template, reset]);

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        ...(isEdit && template ? { id: template.id } : {}),
      };
      const { isSuccess, hasMessage } = await postJson(
        isEdit
          ? ApiRoute.adminPushTemplateUpdate
          : ApiRoute.adminPushTemplateCreate,
        payload
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.pushTemplates);
        onClose();
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsSubmitting(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "템플릿 수정" : "템플릿 추가"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 mt-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">템플릿 이름</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="예: 주간 공지사항"
            />
            {formState.errors.name && (
              <p className="text-xs text-red-500">
                {formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">알림 제목</Label>
            <Input id="title" {...register("title")} placeholder="알림 제목" />
            {formState.errors.title && (
              <p className="text-xs text-red-500">
                {formState.errors.title.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="body">알림 내용</Label>
            <Textarea
              id="body"
              {...register("body")}
              placeholder="알림 내용을 입력하세요"
              rows={4}
            />
            {formState.errors.body && (
              <p className="text-xs text-red-500">
                {formState.errors.body.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="url">URL (선택)</Label>
            <Input id="url" {...register("url")} placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-2">
            <Label>카테고리</Label>
            <Select
              value={watch("category")}
              onValueChange={(v) => setValue("category", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="notice">공지</SelectItem>
                <SelectItem value="event">이벤트</SelectItem>
                <SelectItem value="update">업데이트</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? "수정" : "생성"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

// ─── Send Tab ───

const PushSendTab = () => {
  const {
    methods,
    templates,
    loadTemplate,
    clearForm,
    handleSend,
    isSending,
    showPreview,
    setShowPreview,
  } = useAdminPushSendHook();

  const { register, watch, setValue } = methods;
  const title = watch("title");
  const body = watch("body");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>알림 발송</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>템플릿 불러오기</Label>
            <div className="flex gap-2">
              <Select
                onValueChange={(v) => {
                  if (v === "none") {
                    clearForm();
                  } else {
                    loadTemplate(Number(v));
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="직접 작성" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">직접 작성</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="send-title">제목 *</Label>
            <Input
              id="send-title"
              {...register("title")}
              placeholder="알림 제목"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="send-body">내용 *</Label>
            <Textarea
              id="send-body"
              {...register("body")}
              placeholder="알림 내용을 입력하세요"
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="send-url">URL (선택)</Label>
            <Input
              id="send-url"
              {...register("url")}
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>카테고리</Label>
            <Select
              value={watch("category")}
              onValueChange={(v) => setValue("category", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="notice">공지</SelectItem>
                <SelectItem value="event">이벤트</SelectItem>
                <SelectItem value="update">업데이트</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              미리보기
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || !title.trim() || !body.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? "발송 중..." : "발송하기"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  TT
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {title || "알림 제목"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 break-words">
                    {body || "알림 내용이 여기에 표시됩니다."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">방금 전</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Template Tab ───

const PushTemplateTab = () => {
  const {
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
  } = useAdminPushTemplateHook();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>검색</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={methods.handleSubmit(updatePagination)}
            className="flex gap-2 items-end"
          >
            <div className="flex-1">
              <Input
                {...methods.register("search")}
                placeholder="이름 또는 제목으로 검색"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>템플릿 목록</CardTitle>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제 ({selectedIds.length})
                </Button>
              )}
              <Button size="sm" onClick={() => setIsCreateSheetOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                템플릿 추가
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && (
            <DataTable columns={columns} data={templateData?.templates ?? []} />
          )}
        </CardContent>
      </Card>

      <TemplateSheetForm
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />
      <TemplateSheetForm
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        template={editingTemplate}
        isEdit
      />
    </div>
  );
};

// ─── History Tab ───

const PushHistoryTab = () => {
  const {
    columns,
    methods,
    historyData,
    isLoading,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    selectedHistory,
    updatePagination,
  } = useAdminPushHistoryHook();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>검색</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={methods.handleSubmit(updatePagination)}
            className="flex gap-2 items-end flex-wrap"
          >
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-1">검색어</Label>
              <Input
                {...methods.register("search")}
                placeholder="제목 또는 내용으로 검색"
              />
            </div>
            <div>
              <Label className="text-xs mb-1">시작일</Label>
              <Input type="date" {...methods.register("from_date")} />
            </div>
            <div>
              <Label className="text-xs mb-1">종료일</Label>
              <Input type="date" {...methods.register("to_date")} />
            </div>
            <Button type="submit">검색</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>발송 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && (
            <DataTable columns={columns} data={historyData?.histories ?? []} />
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isDetailSheetOpen}
        onOpenChange={(open) => !open && setIsDetailSheetOpen(false)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>발송 상세</SheetTitle>
          </SheetHeader>
          {selectedHistory && (
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <Label className="text-xs text-muted-foreground">제목</Label>
                <p className="font-medium">{selectedHistory.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">내용</Label>
                <p className="whitespace-pre-wrap">{selectedHistory.body}</p>
              </div>
              {selectedHistory.url && (
                <div>
                  <Label className="text-xs text-muted-foreground">URL</Label>
                  <p className="text-blue-600 break-all">
                    {selectedHistory.url}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    카테고리
                  </Label>
                  <p>{selectedHistory.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    발송 대상
                  </Label>
                  <p>{selectedHistory.recipient_count}명</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    발송자
                  </Label>
                  <p>{selectedHistory.user?.profile?.displayname ?? "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    발송일시
                  </Label>
                  <p>
                    {dayjs(selectedHistory.sent_at).format(
                      "YYYY-MM-DD HH:mm:ss"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ─── Main Form ───

export default function AdminPushNotificationForm() {
  return (
    <Tabs defaultValue="send" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="send">알림 발송</TabsTrigger>
        <TabsTrigger value="templates">템플릿 관리</TabsTrigger>
        <TabsTrigger value="history">발송 내역</TabsTrigger>
      </TabsList>
      <TabsContent value="send" className="mt-4">
        <PushSendTab />
      </TabsContent>
      <TabsContent value="templates" className="mt-4">
        <PushTemplateTab />
      </TabsContent>
      <TabsContent value="history" className="mt-4">
        <PushHistoryTab />
      </TabsContent>
    </Tabs>
  );
}
