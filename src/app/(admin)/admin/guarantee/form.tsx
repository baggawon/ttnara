"use client";

import { useAdminGuaranteeListHook } from "./hook";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { postFormData, refreshCache } from "@/helpers/common";
import { X, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import type { guarantee_company } from "@prisma/client";
import SimpleMarkdownEditor from "@/components/2_molecules/Input/SimpleMarkdownEditor";
import {
  ApiRoute,
  GuaranteeCurrency,
  GuaranteePosition,
  GuaranteePositionLabel,
  QueryKey,
} from "@/helpers/types";
import Image from "next/image";
import { ToastData } from "@/helpers/toastData";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminGuaranteeRegionsGet } from "@/helpers/get";
import type { GuaranteeRegionListResponse } from "@/app/api/admin_di2u3k2j/guarantee_region/read";

const currencyValues = Object.values(GuaranteeCurrency);
const positionValues = Object.values(GuaranteePosition);

const guaranteeFormSchema = z
  .object({
    title: z.string().min(1, "Title을 입력해주세요.").max(200),
    business_name: z.string().min(1, "업체명을 입력해주세요.").max(100),
    telegram_url: z
      .string()
      .min(1, "연락처(Telegram 링크)를 입력해주세요.")
      .url("올바른 URL을 입력해주세요."),
    regions: z
      .array(z.string().min(1).max(100))
      .min(1, "지역을 최소 하나 이상 추가해주세요."),
    no_website: z.boolean(),
    url: z.string().optional(),
    positions: z
      .array(z.enum(positionValues as [string, ...string[]]))
      .min(1, "거래 포지션을 최소 하나 선택해주세요."),
    currencies: z
      .array(z.string())
      .min(1, "취급 화폐를 최소 하나 선택해주세요."),
    deposit: z.string().min(1, "보증금을 입력해주세요.").max(100),
    display_order: z.number().min(1, "1 이상이어야 합니다."),
    is_active: z.boolean(),
    description: z.string().max(50000).optional(),
    description_format: z.enum(["html", "markdown"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.no_website) return;
    const url = (data.url ?? "").trim();
    if (!url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "URL을 입력하거나 '웹사이트 없음'을 활성화해주세요.",
      });
      return;
    }
    try {
      new URL(url);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "올바른 URL을 입력해주세요.",
      });
    }
  });

type GuaranteeFormData = z.infer<typeof guaranteeFormSchema>;

interface SheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  item?: guarantee_company | null;
  isEdit?: boolean;
}

function GuaranteeSheetForm({
  isOpen,
  onClose,
  item,
  isEdit = false,
}: SheetFormProps) {
  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    (item as any)?.public_image_url || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: regionsData } = useGetQuery<
    GuaranteeRegionListResponse,
    undefined
  >({ queryKey: [QueryKey.guaranteeRegions] }, adminGuaranteeRegionsGet);
  const activeRegionNames = (regionsData?.guaranteeRegions ?? [])
    .filter((r) => r.is_active)
    .map((r) => r.name);

  const methods = useForm<GuaranteeFormData>({
    resolver: zodResolver(guaranteeFormSchema),
    defaultValues: {
      title: item?.title || "",
      business_name: item?.business_name || "",
      telegram_url: item?.telegram_url || "https://t.me/",
      regions: item?.regions ?? [],
      no_website: item?.no_website ?? true,
      url: item?.url || "",
      positions: item?.positions ?? [],
      currencies: item?.currencies || [GuaranteeCurrency.USDT],
      deposit: item?.deposit || "",
      display_order: item?.display_order || 1,
      is_active: item?.is_active ?? true,
      description: item?.description ?? "",
      description_format:
        (item?.description_format as "html" | "markdown" | undefined) ?? "html",
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

  const [regionToAdd, setRegionToAdd] = useState<string>("");

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl((item as any)?.public_image_url || null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && item) {
      reset({
        title: item.title ?? "",
        business_name: item.business_name ?? "",
        telegram_url: item.telegram_url ?? "https://t.me/",
        regions: item.regions ?? [],
        no_website: item.no_website ?? !item.url,
        url: item.url ?? "",
        positions: item.positions ?? [],
        currencies: item.currencies ?? [GuaranteeCurrency.USDT],
        deposit: item.deposit ?? "",
        display_order: item.display_order ?? 1,
        is_active: item.is_active ?? true,
        description: item.description ?? "",
        description_format:
          (item.description_format as "html" | "markdown" | null) ?? "html",
      });
      setPreviewUrl((item as any).public_image_url || null);
      setSelectedFile(null);
      setRegionToAdd("");
    } else if (!isEdit) {
      reset({
        title: "",
        business_name: "",
        telegram_url: "https://t.me/",
        regions: [],
        no_website: true,
        url: "",
        positions: [],
        currencies: [GuaranteeCurrency.USDT],
        deposit: "",
        display_order: 1,
        is_active: true,
        description: "",
        description_format: "html",
      });
      setPreviewUrl(null);
      setSelectedFile(null);
      setRegionToAdd("");
    }
  }, [isOpen, isEdit, item, reset]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleCurrency = (c: string) => {
    const current = watch("currencies") || [];
    if (current.includes(c)) {
      setValue(
        "currencies",
        current.filter((x) => x !== c),
        { shouldValidate: true }
      );
    } else {
      setValue("currencies", [...current, c], { shouldValidate: true });
    }
  };

  const addRegion = () => {
    if (!regionToAdd) return;
    const current = watch("regions") || [];
    if (current.includes(regionToAdd)) {
      setRegionToAdd("");
      return;
    }
    setValue("regions", [...current, regionToAdd], { shouldValidate: true });
    setRegionToAdd("");
  };

  const removeRegion = (r: string) => {
    const current = watch("regions") || [];
    setValue(
      "regions",
      current.filter((x) => x !== r),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: GuaranteeFormData) => {
    if (!isEdit && !selectedFile) {
      toast({
        id: ToastData.guaranteeCreateFailed,
        type: "error",
      });
      return;
    }

    const formData = new FormData();
    if (isEdit && item) formData.append("id", item.id.toString());
    formData.append("title", data.title);
    formData.append("business_name", data.business_name);
    formData.append("telegram_url", data.telegram_url);
    formData.append("regions", JSON.stringify(data.regions));
    formData.append("positions", JSON.stringify(data.positions));
    formData.append("no_website", data.no_website.toString());
    formData.append("url", data.no_website ? "" : (data.url ?? "").trim());
    formData.append("currencies", JSON.stringify(data.currencies));
    formData.append("deposit", data.deposit);
    formData.append("display_order", data.display_order.toString());
    formData.append("is_active", data.is_active.toString());
    formData.append("description", data.description ?? "");
    formData.append("description_format", data.description_format ?? "html");
    if (selectedFile) formData.append("image", selectedFile);

    setLoading();
    setIsSubmitting(true);
    try {
      const result = await postFormData(
        isEdit ? ApiRoute.adminGuaranteeUpdate : ApiRoute.adminGuaranteeCreate,
        formData
      );

      if (result.hasMessage) {
        toast({
          id: result.hasMessage,
          type: result.isSuccess ? "success" : "error",
        });
      } else if (result.isSuccess) {
        toast({
          id: isEdit ? ToastData.guaranteeUpdate : ToastData.guaranteeCreate,
          type: "success",
        });
      }

      if (result.isSuccess) {
        refreshCache(queryClient, QueryKey.guaranteeCompanies);
        handleClose();
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    } finally {
      disableLoading();
      setIsSubmitting(false);
    }
  };

  const selectedCurrencies = watch("currencies") || [];

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "공식보증업체 수정" : "공식보증업체 추가"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "공식보증업체 정보를 수정합니다."
              : "새로운 공식보증업체를 추가합니다."}
          </SheetDescription>
        </SheetHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register("title")} placeholder="Title" />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="business_name">업체명 *</Label>
              <Input
                id="business_name"
                {...register("business_name")}
                placeholder="업체명"
              />
              {errors.business_name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.business_name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="telegram_url">연락처 (Telegram 링크) *</Label>
              <Input
                id="telegram_url"
                {...register("telegram_url")}
                placeholder="https://t.me/..."
              />
              {errors.telegram_url && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.telegram_url.message}
                </p>
              )}
            </div>

            <div>
              <Label>지역 *</Label>
              <div className="grid grid-cols-[1fr_auto] gap-2 mt-1">
                <Select
                  value={regionToAdd}
                  onValueChange={(v) => setRegionToAdd(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRegionNames
                      .filter((r) => !(watch("regions") ?? []).includes(r))
                      .map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRegion}
                  disabled={!regionToAdd}
                >
                  추가
                </Button>
              </div>
              {(watch("regions") ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  지역을 한 개 이상 추가해주세요.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 mt-2 rounded-md border">
                  {(watch("regions") ?? []).map((r) => (
                    <Badge
                      key={r}
                      variant="secondary"
                      className="gap-1 pl-2.5 pr-1.5 py-1 text-sm"
                    >
                      {r}
                      <button
                        type="button"
                        onClick={() => removeRegion(r)}
                        className="rounded-full hover:bg-background p-0.5"
                        aria-label={`${r} 제거`}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {errors.regions && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.regions.message as string}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="url">
                  URL{watch("no_website") ? "" : " *"}
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="no_website"
                    checked={watch("no_website")}
                    onCheckedChange={(checked) =>
                      setValue("no_website", checked, { shouldValidate: true })
                    }
                  />
                  <Label htmlFor="no_website" className="text-sm font-normal">
                    웹사이트 없음
                  </Label>
                </div>
              </div>
              {!watch("no_website") && (
                <>
                  <Input
                    id="url"
                    {...register("url")}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                  {errors.url && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.url.message}
                    </p>
                  )}
                </>
              )}
            </div>

            <div>
              <Label>거래 포지션 *</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={watch("positions") ?? []}
                onValueChange={(value) =>
                  setValue("positions", value, { shouldValidate: true })
                }
                className="justify-start mt-2"
              >
                {positionValues.map((p) => (
                  <ToggleGroupItem
                    key={p}
                    value={p}
                    aria-label={GuaranteePositionLabel[p]}
                    className="px-6"
                  >
                    {GuaranteePositionLabel[p]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {errors.positions && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.positions.message as string}
                </p>
              )}
            </div>

            <div>
              <Label>취급 화폐 *</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {currencyValues.map((c) => (
                  <label
                    key={c}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedCurrencies.includes(c)}
                      onCheckedChange={() => toggleCurrency(c)}
                    />
                    <span className="text-sm">{c}</span>
                  </label>
                ))}
              </div>
              {errors.currencies && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.currencies.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deposit">보증금 *</Label>
              <Input
                id="deposit"
                {...register("deposit")}
                placeholder="예: 100,000 USDT"
              />
              {errors.deposit && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.deposit.message}
                </p>
              )}
            </div>

            <div>
              <Label>상세설명</Label>
              <div className="mt-1">
                <SimpleMarkdownEditor
                  name="description"
                  formatName="description_format"
                  placeholder="업체에 대한 상세설명을 입력하세요"
                  minHeight={240}
                />
              </div>
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
              <Label>이미지 (1:1 비율 권장) *</Label>
              <div className="mt-2">
                {previewUrl ? (
                  <div className="relative inline-block">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      className="w-40 h-40 object-cover border border-gray-300 rounded"
                      width={160}
                      height={160}
                      unoptimized
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
                  <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50">
                    <ImageIcon size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">이미지 없음</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  이미지 업로드
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
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminGuaranteeListForm() {
  const {
    columns,
    methods,
    listData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingItem,
    updatePagination,
    handleDelete,
    deleteMutation,
  } = useAdminGuaranteeListHook();

  const { data: regionsData } = useGetQuery<
    GuaranteeRegionListResponse,
    undefined
  >({ queryKey: [QueryKey.guaranteeRegions] }, adminGuaranteeRegionsGet);
  const filterRegions = regionsData?.guaranteeRegions ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>검색 조건</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={methods.handleSubmit(updatePagination)}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            <div>
              <Label htmlFor="search">검색어</Label>
              <Input
                id="search"
                placeholder="Title, 업체명, Telegram"
                {...methods.register("search")}
              />
            </div>

            <div>
              <Label htmlFor="region">지역</Label>
              <Select
                value={methods.watch("region")}
                onValueChange={(value) => methods.setValue("region", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {filterRegions.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                      {!r.is_active && " (삭제됨)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="min-w-0">공식보증업체 목록</CardTitle>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => setIsCreateSheetOpen(true)}
                size="sm"
                aria-label="공식보증업체 추가"
              >
                <Plus className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">공식보증업체 추가</span>
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                aria-label="선택 삭제"
                disabled={selectedIds.length === 0 || deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">선택 삭제 </span>
                <span>({selectedIds.length})</span>
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
            <DataTable columns={columns} data={listData?.items || []} />
          )}
        </CardContent>
      </Card>

      <GuaranteeSheetForm
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />

      <GuaranteeSheetForm
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        item={editingItem}
        isEdit={true}
      />
    </>
  );
}
