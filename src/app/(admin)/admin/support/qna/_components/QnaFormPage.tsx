"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import SimpleMarkdownEditor from "@/components/2_molecules/Input/SimpleMarkdownEditor";
import { useToast } from "@/components/ui/use-toast";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { postJson, refreshCache } from "@/helpers/common";
import {
  adminSupportQnaCategoriesGet,
  adminSupportQnaGet,
} from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";

import type {
  SupportQnaCategoriesListResponse,
  SupportQnaCategoriesReadProps,
} from "@/app/api/admin_di2u3k2j/support/qna-categories/read";
import type {
  SupportQnaListResponse,
  SupportQnaReadProps,
} from "@/app/api/admin_di2u3k2j/support/qna/read";

interface QnaFormValues {
  category_id: string;
  question: string;
  answer: string;
  content_format: string;
  display_order: number;
  is_active: boolean;
}

const DEFAULT_VALUES: QnaFormValues = {
  category_id: "",
  question: "",
  answer: "",
  content_format: "html",
  display_order: 0,
  is_active: true,
};

interface QnaFormPageProps {
  qnaId: number | null;
}

export default function QnaFormPage({ qnaId }: QnaFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = qnaId !== null && qnaId > 0;

  // Shared "all active categories" dropdown query — same key as QnaHook so
  // both stay in sync, and the refreshCache() pattern in common.ts (matches
  // `["x"]` exactly) actually invalidates this on category mutations.
  const { data: categoriesData } = useGetQuery<
    SupportQnaCategoriesListResponse,
    SupportQnaCategoriesReadProps
  >(
    { queryKey: [QueryKey.adminSupportQnaCategories] },
    adminSupportQnaCategoriesGet,
    { page: 1, pageSize: 200, is_active: true },
    { silent: true }
  );

  const { data: qnaData } = useGetQuery<
    SupportQnaListResponse,
    SupportQnaReadProps
  >(
    {
      queryKey: [QueryKey.adminSupportQnaDetail, qnaId ?? 0],
      enabled: isEdit,
    },
    adminSupportQnaGet,
    isEdit
      ? ({ id: qnaId as number } as unknown as SupportQnaReadProps)
      : ({ page: 1, pageSize: 1 } as SupportQnaReadProps),
    { silent: true }
  );

  const methods = useForm<QnaFormValues>({ defaultValues: DEFAULT_VALUES });
  const { register, handleSubmit, reset, setValue, watch } = methods;

  // Populate the form once the existing QnA loads (edit mode).
  useEffect(() => {
    if (!isEdit) return;
    const existing = qnaData?.qnas?.[0];
    if (!existing) return;
    reset({
      category_id: String(existing.category_id),
      question: existing.question,
      answer: existing.answer ?? "",
      content_format: existing.content_format ?? "html",
      display_order: existing.display_order ?? 0,
      is_active: existing.is_active ?? true,
    });
  }, [isEdit, qnaData, reset]);

  // For create mode, pre-select the first active category as a sensible default.
  useEffect(() => {
    if (isEdit) return;
    if (!categoriesData?.categories?.length) return;
    setValue("category_id", String(categoriesData.categories[0].id), {
      shouldDirty: false,
    });
  }, [isEdit, categoriesData, setValue]);

  const goBack = () => {
    router.push(`${AdminAppRoute.Support}?tab=qna`);
  };

  const onSubmit = async (data: QnaFormValues) => {
    const category_id = Number(data.category_id);
    if (!Number.isFinite(category_id) || category_id <= 0) {
      toast({
        id: isEdit
          ? ToastData.supportQnaUpdateFailed
          : ToastData.supportQnaCreateFailed,
        type: "error",
      });
      return;
    }
    if (!data.question.trim()) {
      toast({
        id: isEdit
          ? ToastData.supportQnaUpdateFailed
          : ToastData.supportQnaCreateFailed,
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...(isEdit && qnaId ? { id: qnaId } : {}),
        category_id,
        question: data.question.trim(),
        answer: data.answer ?? "",
        content_format: data.content_format || "html",
        display_order: Number(data.display_order) || 0,
        is_active: data.is_active,
      };
      const url = isEdit
        ? ApiRoute.adminSupportQnaUpdate
        : ApiRoute.adminSupportQnaCreate;
      const result = await postJson(url, payload);

      if (result.hasMessage) {
        toast({
          id: result.hasMessage,
          type: result.isSuccess ? "success" : "error",
        });
      }

      if (result.isSuccess) {
        refreshCache(queryClient, QueryKey.adminSupportQna);
        // The detail query key is [adminSupportQnaDetail, qnaId] — an array
        // shape refreshCache() can't match (it only matches `"key":` or the
        // exact `["key"]`). Invalidate it directly so re-opening 수정 on the
        // same QnA shows the just-saved values rather than the stale detail.
        if (isEdit && qnaId) {
          queryClient.invalidateQueries({
            queryKey: [QueryKey.adminSupportQnaDetail, qnaId],
          });
        }
        goBack();
      }
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = categoriesData?.categories ?? [];

  return (
    <FormProvider {...methods}>
      <section className="w-full flex flex-col gap-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isEdit ? "QnA 수정" : "QnA 추가"}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="category_id">카테고리 *</Label>
                <Select
                  value={watch("category_id")}
                  onValueChange={(value) => setValue("category_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!categories.length && (
                  <p className="text-xs text-muted-foreground mt-1">
                    먼저 카테고리를 생성하세요.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="question">질문 *</Label>
                <Input
                  id="question"
                  {...register("question", { required: true })}
                  placeholder="질문 내용을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_order">순서</Label>
                  <Input
                    id="display_order"
                    type="number"
                    {...register("display_order", { valueAsNumber: true })}
                    min={0}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={watch("is_active")}
                      onCheckedChange={(checked) =>
                        setValue("is_active", checked)
                      }
                    />
                    <Label htmlFor="is_active">활성화</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>답변 *</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleMarkdownEditor
                name="answer"
                formatName="content_format"
                uploadEnabled
                uploadMaxItems={10}
                uploadMaxSizeMb={30}
                uploadAcceptedExtensions={[
                  ".jpg",
                  ".jpeg",
                  ".png",
                  ".gif",
                  ".webp",
                  ".mp4",
                  ".webm",
                  ".mov",
                ]}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
            >
              {isSubmitting ? "저장중..." : isEdit ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </section>
    </FormProvider>
  );
}
