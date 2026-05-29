"use client";

import type {
  GeneralReadProps,
  GeneralReadResult,
} from "@/app/api/admin_di2u3k2j/settings/general/read";
import type { generalUpdateProps } from "@/app/api/admin_di2u3k2j/settings/general/update";
import type { MediaUploadResult } from "@/app/api/uploads/media";
import clsx from "clsx";
import Form from "@/components/1_atoms/Form";
import { FormInput } from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generalDefault } from "@/helpers/defaultValue";
import { adminGeneralGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { version } from "@/helpers/config";
import { validateSiteName } from "@/helpers/validate";
import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";

export const GeneralHandleForm = ({ className }: { className?: string }) => {
  const { data: generalData } = useGetQuery<
    GeneralReadResult,
    GeneralReadProps
  >(
    {
      queryKey: [QueryKey.generalSettings],
    },
    adminGeneralGet,
    undefined,
    { silent: true }
  );

  const methods = useForm({
    defaultValues: generalDefault(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  type BrandImageField =
    | "logo_image_url"
    | "favicon_url"
    | "apple_icon_url"
    | "hero_image_url";

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const appleIconInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [appleIconPreview, setAppleIconPreview] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);

  const [uploadingField, setUploadingField] = useState<BrandImageField | null>(
    null
  );

  useEffectFunctionHook({
    Function: () => {
      if (generalData) {
        methods.reset(generalData);
        setLogoPreview(generalData.logo_image_signed_url);
        setFaviconPreview(generalData.favicon_signed_url);
        setAppleIconPreview(generalData.apple_icon_signed_url);
        setHeroPreview(generalData.hero_image_signed_url);
      }
    },
    dependency: [generalData],
  });

  const setPreview = (field: BrandImageField, url: string | null) => {
    if (field === "logo_image_url") setLogoPreview(url);
    else if (field === "favicon_url") setFaviconPreview(url);
    else if (field === "apple_icon_url") setAppleIconPreview(url);
    else setHeroPreview(url);
  };

  const inputRefForField = (field: BrandImageField) => {
    if (field === "logo_image_url") return logoInputRef;
    if (field === "favicon_url") return faviconInputRef;
    if (field === "apple_icon_url") return appleIconInputRef;
    return heroInputRef;
  };

  const uploadBrandImage = async (field: BrandImageField, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ id: ToastData.attachedTypeLimit, type: "error" });
      return;
    }
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("version", version);
      const res = await fetch(ApiRoute.uploadsMedia, {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as {
        result: boolean;
        message?: string;
        data?: MediaUploadResult;
      };
      if (!json.result || !json.data) {
        toast({ id: ToastData.unknown, type: "error" });
        return;
      }
      methods.setValue(field, json.data.awsCloudFrontUrl, {
        shouldDirty: true,
      });
      setPreview(field, json.data.url);
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    } finally {
      setUploadingField(null);
      const ref = inputRefForField(field);
      if (ref.current) ref.current.value = "";
    }
  };

  const clearBrandImage = (field: BrandImageField) => {
    methods.setValue(field, null, { shouldDirty: true });
    setPreview(field, null);
  };

  const saveMutation = useMutation({
    mutationFn: async (props: generalUpdateProps) => {
      const { isSuccess, hasMessage } = await postJson<generalUpdateProps>(
        ApiRoute.adminGeneralUpdate,
        {
          id: props.id,
          site_name: props.site_name,
          site_title:
            typeof props.site_title === "string" && props.site_title.trim()
              ? props.site_title.trim()
              : null,
          site_description:
            typeof props.site_description === "string" &&
            props.site_description.trim()
              ? props.site_description.trim()
              : null,
          site_keywords:
            typeof props.site_keywords === "string" &&
            props.site_keywords.trim()
              ? props.site_keywords.trim()
              : null,
          logo_image_url: props.logo_image_url ?? null,
          favicon_url: props.favicon_url ?? null,
          apple_icon_url: props.apple_icon_url ?? null,
          hero_image_url: props.hero_image_url ?? null,
          hero_action_url:
            typeof props.hero_action_url === "string" &&
            props.hero_action_url.trim()
              ? props.hero_action_url.trim()
              : null,
        }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.generalSettings);
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const trySave = (props: generalUpdateProps) => {
    if (saveMutation.isPending) return;
    saveMutation.mutate(props);
  };
  const isSubmitting = saveMutation.isPending;

  return (
    <FormProvider {...methods}>
      <Form
        onSubmit={trySave}
        className={clsx(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-4",
          className
        )}
      >
        <FormInput
          name="site_name"
          label="사이트 이름"
          placeholder="브랜드명"
          validate={validateSiteName}
        />
        <FormInput
          name="site_title"
          label="페이지 타이틀"
          placeholder="브라우저 탭에 표시되는 제목 (비워두면 사이트 이름 사용)"
        />
        <FormInput
          name="site_description"
          label="사이트 설명 (메타)"
          placeholder="검색엔진 및 SNS 공유 시 표시되는 설명"
          inputClassName="sm:col-span-2"
        />
        <FormInput
          name="site_keywords"
          label="키워드 (쉼표로 구분)"
          placeholder="예: 테더, p2p, usdt"
          inputClassName="sm:col-span-2"
        />

        <BrandImageSlot
          field="logo_image_url"
          label="로고 이미지"
          inputId="general-logo-input"
          inputRef={logoInputRef}
          preview={logoPreview}
          uploading={uploadingField === "logo_image_url"}
          previewBoxClassName="w-32 h-16"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
          uploadLabel="로고"
          description={
            <>
              업로드한 로고는 헤더, 로그인 화면 등 모든 위치에서 사용됩니다.
              <br />
              권장: 가로형 PNG/SVG, 높이 약 64px.
            </>
          }
          onUpload={(file) => void uploadBrandImage("logo_image_url", file)}
          onClear={() => clearBrandImage("logo_image_url")}
        />

        <BrandImageSlot
          field="favicon_url"
          label="파비콘 (Favicon)"
          inputId="general-favicon-input"
          inputRef={faviconInputRef}
          preview={faviconPreview}
          uploading={uploadingField === "favicon_url"}
          previewBoxClassName="w-16 h-16"
          accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
          uploadLabel="파비콘"
          description={
            <>
              브라우저 탭 아이콘으로 사용됩니다.
              <br />
              권장: 정사각형 PNG/ICO/SVG, 32×32 또는 64×64.
            </>
          }
          onUpload={(file) => void uploadBrandImage("favicon_url", file)}
          onClear={() => clearBrandImage("favicon_url")}
        />

        <BrandImageSlot
          field="apple_icon_url"
          label="Apple 터치 아이콘 (선택)"
          inputId="general-apple-icon-input"
          inputRef={appleIconInputRef}
          preview={appleIconPreview}
          uploading={uploadingField === "apple_icon_url"}
          previewBoxClassName="w-16 h-16"
          accept="image/png,image/jpeg,image/jpg"
          uploadLabel="아이콘"
          description={
            <>
              iOS 홈 화면에 추가 시 사용됩니다. 비워두면 파비콘이 사용됩니다.
              <br />
              권장: 정사각형 PNG, 180×180.
            </>
          }
          onUpload={(file) => void uploadBrandImage("apple_icon_url", file)}
          onClear={() => clearBrandImage("apple_icon_url")}
        />

        <BrandImageSlot
          field="hero_image_url"
          label="히어로 배너 이미지"
          inputId="general-hero-input"
          inputRef={heroInputRef}
          preview={heroPreview}
          uploading={uploadingField === "hero_image_url"}
          previewBoxClassName="w-64 h-24"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          uploadLabel="배너"
          description={
            <>
              메인 홈 최상단에 모든 콘텐츠보다 위에 표시되는 배너입니다.
              <br />
              권장: 가로형, 1920×480px 이상.
            </>
          }
          onUpload={(file) => void uploadBrandImage("hero_image_url", file)}
          onClear={() => clearBrandImage("hero_image_url")}
        />

        <FormInput
          name="hero_action_url"
          label="히어로 배너 클릭 링크 (선택)"
          placeholder="예: /event 또는 https://example.com"
          inputClassName="sm:col-span-2"
        />

        <Button
          type="submit"
          className="w-fit sm:col-span-2"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          저장
        </Button>
      </Form>
    </FormProvider>
  );
};

const BrandImageSlot = ({
  label,
  inputId,
  inputRef,
  preview,
  uploading,
  previewBoxClassName,
  accept,
  uploadLabel,
  description,
  onUpload,
  onClear,
}: {
  field: "logo_image_url" | "favicon_url" | "apple_icon_url" | "hero_image_url";
  label: string;
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  preview: string | null;
  uploading: boolean;
  previewBoxClassName: string;
  accept: string;
  uploadLabel: string;
  description: React.ReactNode;
  onUpload: (file: File) => void;
  onClear: () => void;
}) => {
  return (
    <div className="sm:col-span-2 flex flex-col gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            "border rounded-md flex items-center justify-center bg-neutral-50 overflow-hidden",
            previewBoxClassName
          )}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-black/40" />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={label}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-black/30">없음</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={inputId}
            className={clsx(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-pointer w-fit",
              uploading && "opacity-50 pointer-events-none"
            )}
          >
            {preview ? `${uploadLabel} 교체` : `${uploadLabel} 업로드`}
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              className="hidden"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
              disabled={uploading}
            />
          </Label>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="w-fit text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {uploadLabel} 제거
            </Button>
          )}
          <p className="text-xs text-black/40">{description}</p>
        </div>
      </div>
    </div>
  );
};
