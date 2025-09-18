"use client";

import { useAdminPopupListHook } from "./hook";
import { DataTable } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { postFormData, refreshCache } from "@/helpers/common";
import { ToastData } from "@/helpers/toastData";
import { X, Upload, ImageIcon } from "lucide-react";
import type { popup } from "@prisma/client";
import { ApiRoute, QueryKey } from "@/helpers/types";
import Image from "next/image";
import { FormBuilder } from "@/components/2_molecules/Input/FormInput";
import { DatePicker } from "@/components/2_molecules/Input/DatePicker";
import dayjs from "dayjs";

const popupFormSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다")
    .max(200, "제목은 200자 이내여야 합니다"),
  content: z.string().min(1, "내용은 필수입니다"),
  link_url: z
    .string()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: "올바른 URL을 입력하세요",
    })
    .optional(),
  link_target: z.enum(["_blank", "_self"]),
  position: z.enum([
    "center",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ]),
  width: z.number().min(100).max(1000),
  height: z.number().min(100).max(1000),
  start_date: z.date({ error: "시작 일시는 필수입니다" }),
  end_date: z.date({ error: "종료 일시는 필수입니다" }),
  is_active: z.boolean(),
  show_on_mobile: z.boolean(),
  show_on_desktop: z.boolean(),
  cookie_days: z.number().min(0).max(365),
  show_hide_option: z.boolean(),
  display_order: z.number().min(1),
});

type PopupFormData = z.infer<typeof popupFormSchema>;

interface PopupSheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  popup?: popup | null;
  isEdit?: boolean;
}

function PopupSheetForm({
  isOpen,
  onClose,
  popup,
  isEdit = false,
}: PopupSheetFormProps) {
  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    popup?.image_cloud_front_url || null
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<PopupFormData>({
    resolver: zodResolver(popupFormSchema),
    defaultValues: {
      title: "",
      content: "",
      link_url: "",
      link_target: "_blank",
      position: "center",
      width: 400,
      height: 500,
      start_date: new Date(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      is_active: true,
      show_on_mobile: true,
      show_on_desktop: true,
      cookie_days: 1,
      show_hide_option: true,
      display_order: 1,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = methods;

  const handleClose = () => {
    methods.reset();
    setSelectedImageFile(null);
    setImagePreviewUrl(popup?.image_cloud_front_url || null);
    setRemoveImage(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && popup) {
      methods.reset({
        title: popup.title ?? "",
        content: popup.content ?? "",
        link_url: popup.link_url ?? "",
        link_target: (popup.link_target as "_blank" | "_self") ?? "_blank",
        position:
          (popup.position as
            | "center"
            | "top-left"
            | "top-right"
            | "bottom-left"
            | "bottom-right") ?? "center",
        width: popup.width ?? 400,
        height: popup.height ?? 500,
        start_date: new Date(popup.start_date),
        end_date: new Date(popup.end_date),
        is_active: popup.is_active ?? true,
        show_on_mobile: popup.show_on_mobile ?? true,
        show_on_desktop: popup.show_on_desktop ?? true,
        cookie_days: popup.cookie_days ?? 1,
        show_hide_option: popup.show_hide_option ?? true,
        display_order: popup.display_order ?? 1,
      });
      setImagePreviewUrl(popup.image_cloud_front_url || null);
      setRemoveImage(false);
    } else if (!isEdit) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      methods.reset({
        title: "",
        content: "",
        link_url: "",
        link_target: "_blank",
        position: "center",
        width: 400,
        height: 500,
        start_date: now,
        end_date: tomorrow,
        is_active: true,
        show_on_mobile: true,
        show_on_desktop: true,
        cookie_days: 1,
        show_hide_option: true,
        display_order: 1,
      });
      setImagePreviewUrl(null);
      setRemoveImage(false);
    }
  }, [isOpen, isEdit, popup, reset, methods]);

  const handleImageFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setRemoveImage(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setRemoveImage(true);
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: PopupFormData) => {
    const formData = new FormData();

    if (isEdit && popup) {
      formData.append("id", popup.id.toString());
    }

    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("link_url", data.link_url || "");
    formData.append("link_target", data.link_target);
    formData.append("position", data.position);
    formData.append("width", data.width.toString());
    formData.append("height", data.height.toString());
    formData.append("start_date", data.start_date.toISOString());
    formData.append("end_date", data.end_date.toISOString());
    formData.append("is_active", data.is_active.toString());
    formData.append("show_on_mobile", data.show_on_mobile.toString());
    formData.append("show_on_desktop", data.show_on_desktop.toString());
    formData.append("cookie_days", data.cookie_days.toString());
    formData.append("show_hide_option", data.show_hide_option.toString());
    formData.append("display_order", data.display_order.toString());

    if (selectedImageFile) {
      formData.append("image_file", selectedImageFile);
    }

    if (removeImage) {
      formData.append("remove_image", "true");
    }

    setLoading();
    setIsSubmitting(true);
    try {
      let result: { isSuccess: boolean; hasMessage?: string } = {
        isSuccess: false,
      };

      if (isEdit) {
        result = await postFormData(ApiRoute.adminPopupUpdate, formData);
      } else {
        result = await postFormData(ApiRoute.adminPopupCreate, formData);
      }

      if (result.hasMessage) {
        toast({
          id: result.hasMessage,
          type: result.isSuccess ? "success" : "error",
        });
      }

      if (result.isSuccess) {
        refreshCache(queryClient, QueryKey.popups);
        handleClose();
      }
    } catch (error) {
      console.error("Popup form submit error:", error);
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    } finally {
      disableLoading();
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "팝업 수정" : "팝업 추가"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "팝업 정보를 수정합니다." : "새로운 팝업을 추가합니다."}
          </SheetDescription>
        </SheetHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="팝업 제목"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                {...register("content")}
                placeholder="팝업 내용을 입력하세요"
                className="min-h-[100px]"
              />
              {errors.content && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div>
              <Label>이미지</Label>
              <div className="mt-2">
                {imagePreviewUrl ? (
                  <div className="relative inline-block">
                    <Image
                      src={imagePreviewUrl}
                      alt="Popup Preview"
                      className="w-32 h-32 object-cover border border-gray-300 rounded"
                      width={128}
                      height={128}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50">
                    <ImageIcon size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">이미지 없음</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  이미지 업로드
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="link_url">링크 URL</Label>
              <Input
                id="link_url"
                {...register("link_url")}
                placeholder="https://example.com"
              />
              {errors.link_url && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.link_url.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="link_target">링크 타겟</Label>
              <Select
                value={watch("link_target")}
                onValueChange={(value) =>
                  setValue("link_target", value as "_blank" | "_self")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_blank">새 창</SelectItem>
                  <SelectItem value="_self">현재 창</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">위치</Label>
              <Select
                value={watch("position")}
                onValueChange={(value) => setValue("position", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">중앙</SelectItem>
                  <SelectItem value="top-left">상단 왼쪽</SelectItem>
                  <SelectItem value="top-right">상단 오른쪽</SelectItem>
                  <SelectItem value="bottom-left">하단 왼쪽</SelectItem>
                  <SelectItem value="bottom-right">하단 오른쪽</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">너비 (px) *</Label>
                <Input
                  id="width"
                  type="number"
                  {...register("width", { valueAsNumber: true })}
                  min="100"
                  max="1000"
                />
                {errors.width && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.width.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="height">높이 (px) *</Label>
                <Input
                  id="height"
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                  min="100"
                  max="1000"
                />
                {errors.height && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.height.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormBuilder name="start_date" label="시작 일시 *">
                <DatePicker
                  name="start_date"
                  fromYear={dayjs().set("years", 2020).toDate()}
                  toYear={dayjs().add(10, "years").toDate()}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.start_date.message}
                  </p>
                )}
              </FormBuilder>
              <FormBuilder name="end_date" label="종료 일시 *">
                <DatePicker
                  name="end_date"
                  fromYear={dayjs().set("years", 2020).toDate()}
                  toYear={dayjs().add(10, "years").toDate()}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.end_date.message}
                  </p>
                )}
              </FormBuilder>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cookie_days">쿠키 유효기간 (일) *</Label>
                <Input
                  id="cookie_days"
                  type="number"
                  {...register("cookie_days", { valueAsNumber: true })}
                  min="0"
                  max="365"
                />
                {errors.cookie_days && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.cookie_days.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="display_order">표시 순서 *</Label>
                <Input
                  id="display_order"
                  type="number"
                  {...register("display_order", { valueAsNumber: true })}
                  min="1"
                />
                {errors.display_order && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.display_order.message}
                  </p>
                )}
              </div>
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
                id="show_on_mobile"
                checked={watch("show_on_mobile")}
                onCheckedChange={(checked) =>
                  setValue("show_on_mobile", checked)
                }
              />
              <Label htmlFor="show_on_mobile">모바일에서 표시</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show_on_desktop"
                checked={watch("show_on_desktop")}
                onCheckedChange={(checked) =>
                  setValue("show_on_desktop", checked)
                }
              />
              <Label htmlFor="show_on_desktop">데스크탑에서 표시</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show_hide_option"
                checked={watch("show_hide_option")}
                onCheckedChange={(checked) =>
                  setValue("show_hide_option", checked)
                }
              />
              <Label htmlFor="show_hide_option">
                &quot;하루 동안 보지 않기&quot; 옵션 표시
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : isEdit ? "수정" : "추가"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminPopupListForm() {
  const {
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
  } = useAdminPopupListHook();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>검색 조건</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={methods.handleSubmit(updatePagination)}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <Label htmlFor="search">검색어</Label>
              <Input
                id="search"
                placeholder="제목, 내용"
                {...methods.register("search")}
              />
            </div>

            <div>
              <Label htmlFor="is_active">상태</Label>
              <Select
                value={methods.watch("is_active")}
                onValueChange={(value) => methods.setValue("is_active", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="true">활성</SelectItem>
                  <SelectItem value="false">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">정렬</Label>
              <Select
                value={methods.watch("order")}
                onValueChange={(value) => methods.setValue("order", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">최신순</SelectItem>
                  <SelectItem value="asc">오래된순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                검색
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>팝업 목록</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
                팝업 추가
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={
                  selectedIds.length === 0 || deletePopupsMutation.isPending
                }
              >
                선택 삭제 ({selectedIds.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-sm text-gray-500">로딩중...</div>
            </div>
          ) : (
            <DataTable columns={columns} data={popupData?.popups || []} />
          )}
        </CardContent>
      </Card>

      <PopupSheetForm
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />

      <PopupSheetForm
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        popup={editingPopup}
        isEdit={true}
      />
    </>
  );
}
