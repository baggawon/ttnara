import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3, stripCloudFrontSignatures } from "@/helpers/server/s3";
import { GuaranteeCurrency, GuaranteePosition } from "@/helpers/types";

const POSITION_VALUES = Object.values(GuaranteePosition) as string[];
const CURRENCY_VALUES = Object.values(GuaranteeCurrency) as string[];

const getActiveRegionNames = async (): Promise<Set<string>> => {
  const rows = await handleConnect((prisma) =>
    prisma.guarantee_region.findMany({
      where: { is_active: true },
      select: { name: true },
    })
  );
  return new Set((rows ?? []).map((r) => r.name));
};

const IMAGE_MAX_BYTES = 20 * 1024 * 1024;

const parseStringArray = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
};

export const POST = async (formData: FormData) => {
  try {
    await requestValidator([RequestValidator.Admin], formData);

    const title = (formData.get("title") as string)?.trim();
    const business_name = (formData.get("business_name") as string)?.trim();
    const telegram_url = (formData.get("telegram_url") as string)?.trim();
    const no_website = formData.get("no_website") === "true";
    const url = (formData.get("url") as string)?.trim() || "";
    const deposit = (formData.get("deposit") as string)?.trim();
    const activeRegions = await getActiveRegionNames();
    const regions = parseStringArray(
      formData.get("regions") as string | null
    ).filter((r) => activeRegions.has(r));
    const positions = parseStringArray(
      formData.get("positions") as string | null
    ).filter((p) => POSITION_VALUES.includes(p));
    const currencies = parseStringArray(
      formData.get("currencies") as string | null
    ).filter((c) => CURRENCY_VALUES.includes(c));
    const display_order =
      parseInt(formData.get("display_order") as string) || 1;
    const is_active = formData.get("is_active") === "true";
    const imageFile = formData.get("image") as File | null;
    // Strip CloudFront signatures — description is signed on read, so editor
    // round-trips must not persist an expiring signature.
    const description = stripCloudFrontSignatures(
      (formData.get("description") as string) ?? ""
    );
    const descriptionFormatRaw = (
      formData.get("description_format") as string | null
    )?.trim();
    const description_format =
      descriptionFormatRaw === "markdown" ? "markdown" : "html";

    if (!title || !business_name || !telegram_url || !deposit) {
      return {
        result: false,
        message: "필수 입력 항목이 누락되었습니다.",
      };
    }

    if (regions.length === 0) {
      return { result: false, message: "지역을 최소 하나 이상 선택해주세요." };
    }

    if (positions.length === 0) {
      return {
        result: false,
        message: "거래 포지션을 최소 하나 선택해주세요.",
      };
    }

    if (currencies.length === 0) {
      return {
        result: false,
        message: "취급 화폐를 최소 하나 이상 선택해주세요.",
      };
    }

    if (!no_website) {
      if (!url) {
        return { result: false, message: "URL을 입력해주세요." };
      }
      try {
        new URL(url);
      } catch {
        return { result: false, message: "올바른 URL을 입력해주세요." };
      }
    }

    if (!imageFile || imageFile.size === 0) {
      return { result: false, message: "이미지를 업로드해주세요." };
    }

    if (imageFile.size > IMAGE_MAX_BYTES) {
      return {
        result: false,
        message: "이미지 크기가 너무 큽니다 (최대 20MB)",
      };
    }

    let public_image_url = "";
    let image_url = "";
    try {
      const uploadResult = await uploadFileToS3(imageFile, "guarantee/items");
      public_image_url = uploadResult.filename;
      image_url = uploadResult.aws_url;
    } catch (uploadError) {
      console.error("Guarantee image upload error:", uploadError);
      return { result: false, message: "이미지 업로드에 실패했습니다." };
    }

    const createResult = await handleConnect((prisma) =>
      prisma.guarantee_company.create({
        data: {
          title,
          business_name,
          telegram_url,
          regions,
          positions,
          no_website,
          url: no_website ? "" : url,
          currencies,
          deposit,
          display_order,
          is_active,
          public_image_url,
          image_url,
          description: description || null,
          description_format: description ? description_format : null,
        },
      })
    );

    if (!createResult) throw ToastData.guaranteeCreateFailed;

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
