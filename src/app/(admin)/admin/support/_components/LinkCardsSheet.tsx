"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Upload, Image as ImageIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import { useQueryClient } from "@tanstack/react-query";
import { postFormData, refreshCache } from "@/helpers/common";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { support_link_card } from "@prisma/client";

const linkCardSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요").max(200),
  description: z.string().max(2000).optional(),
  url: z
    .string()
    .min(1, "URL을 입력하세요")
    .refine(
      (v) =>
        v.startsWith("http://") ||
        v.startsWith("https://") ||
        v.startsWith("/"),
      "URL은 http(s):// 또는 /로 시작해야 합니다"
    ),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
  opens_in_new_tab: z.boolean(),
});

type LinkCardFormData = z.infer<typeof linkCardSchema>;

interface LinkCardSheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  card?: support_link_card | null;
  isEdit?: boolean;
}

export default function LinkCardsSheet({
  isOpen,
  onClose,
  card,
  isEdit = false,
}: LinkCardSheetFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(
    card?.cloudfront_url ?? null
  );
  const [removeIcon, setRemoveIcon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LinkCardFormData>({
    resolver: zodResolver(linkCardSchema),
    defaultValues: {
      title: card?.title ?? "",
      description: card?.description ?? "",
      url: card?.url ?? "https://",
      display_order: card?.display_order ?? 0,
      is_active: card?.is_active ?? true,
      opens_in_new_tab: card?.opens_in_new_tab ?? true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && card) {
      reset({
        title: card.title ?? "",
        description: card.description ?? "",
        url: card.url ?? "https://",
        display_order: card.display_order ?? 0,
        is_active: card.is_active ?? true,
        opens_in_new_tab: card.opens_in_new_tab ?? true,
      });
      setIconPreviewUrl(card.cloudfront_url ?? null);
    } else if (!isEdit) {
      reset({
        title: "",
        description: "",
        url: "https://",
        display_order: 0,
        is_active: true,
        opens_in_new_tab: true,
      });
      setIconPreviewUrl(null);
    }
    setSelectedIconFile(null);
    setRemoveIcon(false);
  }, [isOpen, isEdit, card, reset]);

  const handleClose = () => {
    reset();
    setSelectedIconFile(null);
    setIconPreviewUrl(card?.cloudfront_url ?? null);
    setRemoveIcon(false);
    onClose();
  };

  const handleIconFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedIconFile(file);
    setRemoveIcon(false);
    const reader = new FileReader();
    reader.onload = (e) => setIconPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveIcon = () => {
    setSelectedIconFile(null);
    setIconPreviewUrl(null);
    setRemoveIcon(true);
    if (iconInputRef.current) iconInputRef.current.value = "";
  };

  const onSubmit = async (data: LinkCardFormData) => {
    const formData = new FormData();
    if (isEdit && card) formData.append("id", String(card.id));
    formData.append("title", data.title);
    formData.append("description", data.description ?? "");
    formData.append("url", data.url);
    formData.append("display_order", String(data.display_order));
    formData.append("is_active", String(data.is_active));
    formData.append("opens_in_new_tab", String(data.opens_in_new_tab));
    if (selectedIconFile) formData.append("iconImage", selectedIconFile);
    if (removeIcon) formData.append("removeIcon", "true");

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await postFormData(ApiRoute.adminSupportLinkCardsUpdate, formData)
        : await postFormData(ApiRoute.adminSupportLinkCardsCreate, formData);

      if (result.hasMessage) {
        toast({
          id: result.hasMessage,
          type: result.isSuccess ? "success" : "error",
        });
      }

      if (result.isSuccess) {
        refreshCache(queryClient, QueryKey.adminSupportLinkCards);
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
          <SheetTitle>
            {isEdit ? "링크 카드 수정" : "링크 카드 추가"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "링크 카드 정보를 수정합니다."
              : "새로운 링크 카드를 추가합니다."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" {...register("title")} placeholder="문의하기" />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="빠르고 정확한 1:1문의 서비스"
              rows={2}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="https://example.com or /board/notice"
            />
            {errors.url && (
              <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
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

          <div className="flex items-center space-x-2">
            <Switch
              id="opens_in_new_tab"
              checked={watch("opens_in_new_tab")}
              onCheckedChange={(checked) =>
                setValue("opens_in_new_tab", checked)
              }
            />
            <Label htmlFor="opens_in_new_tab">새 창에서 열기</Label>
          </div>

          <div>
            <Label>아이콘 이미지</Label>
            <div className="mt-2">
              {iconPreviewUrl ? (
                <div className="relative inline-block">
                  <Image
                    src={iconPreviewUrl}
                    alt="Icon Preview"
                    className="w-24 h-24 object-cover border rounded"
                    width={96}
                    height={96}
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={handleRemoveIcon}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50">
                  <ImageIcon size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">아이콘 없음</span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => iconInputRef.current?.click()}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                아이콘 이미지 업로드
              </Button>
            </div>
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
