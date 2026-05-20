"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { postFormData, refreshCache } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { adminGuaranteeBannerGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import Image from "next/image";
import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import type { GuaranteeBannerResponse } from "@/app/api/admin_di2u3k2j/guarantee/banner/read";

export default function AdminGuaranteeBannerCard() {
  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const { data } = useGetQuery<GuaranteeBannerResponse, undefined>(
    { queryKey: [QueryKey.guaranteeBanner] },
    adminGuaranteeBannerGet
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeFlag, setRemoveFlag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentPreview =
    previewUrl ?? (removeFlag ? null : (data?.public_hero_image_url ?? null));

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setRemoveFlag(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveFlag(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    const formData = new FormData();
    if (selectedFile) formData.append("image", selectedFile);
    if (removeFlag) formData.append("removeImage", "true");

    setLoading();
    setIsSaving(true);
    try {
      const result = await postFormData(
        ApiRoute.adminGuaranteeBannerUpdate,
        formData
      );
      if (result.hasMessage) {
        toast({
          id: result.isSuccess
            ? ToastData.guaranteeBannerUpdate
            : (result.hasMessage as any),
          type: result.isSuccess ? "success" : "error",
        });
      } else if (result.isSuccess) {
        toast({ id: ToastData.guaranteeBannerUpdate, type: "success" });
      }
      if (result.isSuccess) {
        setSelectedFile(null);
        setPreviewUrl(null);
        setRemoveFlag(false);
        refreshCache(queryClient, QueryKey.guaranteeBanner);
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    } finally {
      disableLoading();
      setIsSaving(false);
    }
  };

  const hasPendingChange = selectedFile !== null || removeFlag;

  return (
    <Card>
      <CardHeader>
        <CardTitle>히어로 배너</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          {currentPreview ? (
            <div className="relative inline-block w-full max-w-2xl">
              <Image
                src={currentPreview}
                alt="Guarantee hero banner"
                width={1200}
                height={300}
                className="w-full object-cover border border-gray-300 rounded"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="w-full max-w-2xl h-40 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50">
              <ImageIcon size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">배너 이미지 없음</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} className="mr-2" />
            이미지 선택
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasPendingChange || isSaving}
          >
            {isSaving ? "저장중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
