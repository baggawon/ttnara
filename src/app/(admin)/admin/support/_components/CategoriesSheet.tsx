"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

import { useQueryClient } from "@tanstack/react-query";
import { postJson, refreshCache } from "@/helpers/common";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { CategoryRow } from "./CategoriesHook";

const categorySchema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(100),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoriesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryRow | null;
  isEdit?: boolean;
}

export default function CategoriesSheet({
  isOpen,
  onClose,
  category,
  isEdit = false,
}: CategoriesSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      display_order: category?.display_order ?? 0,
      is_active: category?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && category) {
      reset({
        name: category.name,
        display_order: category.display_order ?? 0,
        is_active: category.is_active ?? true,
      });
    } else if (!isEdit) {
      reset({ name: "", display_order: 0, is_active: true });
    }
  }, [isOpen, isEdit, category, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      const payload = isEdit && category ? { id: category.id, ...data } : data;
      const url = isEdit
        ? ApiRoute.adminSupportQnaCategoriesUpdate
        : ApiRoute.adminSupportQnaCategoriesCreate;
      const result = await postJson(url, payload);

      if (result.hasMessage) {
        toast({
          id: result.hasMessage,
          type: result.isSuccess ? "success" : "error",
        });
      }
      if (result.isSuccess) {
        refreshCache(queryClient, QueryKey.adminSupportQnaCategories);
        handleClose();
      }
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "카테고리 수정" : "카테고리 추가"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "QnA 카테고리 정보를 수정합니다."
              : "새로운 QnA 카테고리를 추가합니다."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">이름 *</Label>
            <Input id="name" {...register("name")} placeholder="일반" />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="display_order">순서</Label>
            <Input
              id="display_order"
              type="number"
              {...register("display_order", { valueAsNumber: true })}
              min={0}
            />
            {errors.display_order && (
              <p className="text-sm text-red-600 mt-1">
                {errors.display_order.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">활성화</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "저장중..." : isEdit ? "수정" : "추가"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
