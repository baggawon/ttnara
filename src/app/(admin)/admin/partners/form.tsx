"use client";

import { useAdminPartnersListHook } from "./hook";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { postFormData, refreshCache, parseFetchResult } from "@/helpers/common";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import type { partner } from "@prisma/client";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import Image from "next/image";
import { ToastData } from "@/helpers/toastData";

const partnerFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  url: z.string().url("Please enter a valid URL"),
  display_order: z.number().min(1, "Order must be 1 or greater"),
  is_active: z.boolean(),
});

type PartnerFormData = z.infer<typeof partnerFormSchema>;

interface PartnerSheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: partner | null;
  isEdit?: boolean;
}

// remove mutation helpers in favor of traditional submit pattern

function PartnerSheetForm({
  isOpen,
  onClose,
  partner,
  isEdit = false,
}: PartnerSheetFormProps) {
  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const partnerFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(
    null
  );
  const [selectedPartnerFile, setSelectedPartnerFile] = useState<File | null>(
    null
  );
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(
    partner?.public_banner_image_url || null
  );
  const [partnerPreviewUrl, setPartnerPreviewUrl] = useState<string | null>(
    partner?.public_partner_image_url || null
  );
  const [removeBannerImage, setRemoveBannerImage] = useState(false);
  const [removePartnerImage, setRemovePartnerImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      name: partner?.name || "",
      url: partner?.url || "https://",
      display_order: partner?.display_order || 1,
      is_active: partner?.is_active ?? true,
    },
  });

  // remove react-query mutations

  const handleClose = () => {
    reset();
    setSelectedBannerFile(null);
    setSelectedPartnerFile(null);
    setBannerPreviewUrl(`https://${partner?.public_banner_image_url}` || null);
    setPartnerPreviewUrl(
      `https://${partner?.public_partner_image_url}` || null
    );
    setRemoveBannerImage(false);
    setRemovePartnerImage(false);
    onClose();
  };

  // Populate form when sheet opens or when the editing partner changes
  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && partner) {
      reset({
        name: partner.name ?? "",
        url: partner.url ?? "https://",
        display_order: partner.display_order ?? 1,
        is_active: partner.is_active ?? true,
      });
      setBannerPreviewUrl(`https://${partner.public_banner_image_url}` || null);
      setPartnerPreviewUrl(
        `https://${partner.public_partner_image_url}` || null
      );
      setRemoveBannerImage(false);
      setRemovePartnerImage(false);
    } else if (!isEdit) {
      reset({
        name: "",
        url: "https://",
        display_order: 1,
        is_active: true,
      });
      setBannerPreviewUrl(null);
      setPartnerPreviewUrl(null);
      setRemoveBannerImage(false);
      setRemovePartnerImage(false);
    }
  }, [isOpen, isEdit, partner, reset]);

  const handleBannerFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedBannerFile(file);
      setRemoveBannerImage(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePartnerFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPartnerFile(file);
      setRemovePartnerImage(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPartnerPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBannerImage = () => {
    setSelectedBannerFile(null);
    setBannerPreviewUrl(null);
    setRemoveBannerImage(true);
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = "";
    }
  };

  const handleRemovePartnerImage = () => {
    setSelectedPartnerFile(null);
    setPartnerPreviewUrl(null);
    setRemovePartnerImage(true);
    if (partnerFileInputRef.current) {
      partnerFileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: PartnerFormData) => {
    const formData = new FormData();

    if (isEdit && partner) {
      formData.append("id", partner.id.toString());
    }

    formData.append("name", data.name);
    formData.append("url", data.url);
    formData.append("display_order", data.display_order.toString());
    formData.append("is_active", data.is_active.toString());

    if (selectedBannerFile) {
      formData.append("bannerImage", selectedBannerFile);
    }

    if (selectedPartnerFile) {
      formData.append("partnerImage", selectedPartnerFile);
    }

    if (removeBannerImage) {
      formData.append("removeBannerImage", "true");
    }

    if (removePartnerImage) {
      formData.append("removePartnerImage", "true");
    }
    setLoading();
    setIsSubmitting(true);
    try {
      let result: { isSuccess: boolean; hasMessage?: string } = {
        isSuccess: false,
      };

      if (isEdit) {
        result = await postFormData(ApiRoute.adminPartnersUpdate, formData);
      } else {
        result = await postFormData(ApiRoute.adminPartnersCreate, formData);
      }

      if (result.hasMessage) {
        toast({
          id: result.hasMessage,
          type: result.isSuccess ? "success" : "error",
        });
      }

      if (result.isSuccess) {
        refreshCache(queryClient, QueryKey.partners);
        handleClose();
      }
    } catch (error) {
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
          <SheetTitle>{isEdit ? "협력사 수정" : "협력사 추가"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "협력사 정보를 수정합니다."
              : "새로운 협력사를 추가합니다."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">이름 *</Label>
            <Input id="name" {...register("name")} placeholder="Enter name" />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="https://example.com"
            />
            {errors.url && (
              <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="display_order">순서 *</Label>
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

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">활성화</Label>
          </div>

          <div>
            <Label>배너 이미지</Label>
            <div className="mt-2">
              {bannerPreviewUrl ? (
                <div className="relative inline-block">
                  <Image
                    src={bannerPreviewUrl}
                    alt="Banner Preview"
                    className="w-32 h-32 object-cover border border-gray-300 rounded"
                    width={128}
                    height={128}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveBannerImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50">
                  <ImageIcon size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    배너 이미지 없음
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => bannerFileInputRef.current?.click()}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                배너 이미지 업로드
              </Button>
            </div>
          </div>

          <div>
            <Label>파트너 이미지</Label>
            <div className="mt-2">
              {partnerPreviewUrl ? (
                <div className="relative inline-block">
                  <Image
                    src={partnerPreviewUrl}
                    alt="Partner Preview"
                    className="w-32 h-32 object-cover border border-gray-300 rounded"
                    width={128}
                    height={128}
                  />
                  <button
                    type="button"
                    onClick={handleRemovePartnerImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50">
                  <ImageIcon size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    파트너 이미지 없음
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <input
                ref={partnerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePartnerFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => partnerFileInputRef.current?.click()}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                파트너 이미지 업로드
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

export default function AdminPartnersListForm() {
  const {
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
  } = useAdminPartnersListHook();

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
                placeholder="Name, URL"
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
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
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
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
            <CardTitle>협력사 목록</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
                협력사 추가
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={
                  selectedIds.length === 0 || deletePartnersMutation.isPending
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
            <DataTable columns={columns} data={partnersData?.partners || []} />
          )}
        </CardContent>
      </Card>

      <PartnerSheetForm
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />

      <PartnerSheetForm
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        partner={editingPartner}
        isEdit={true}
      />
    </>
  );
}
