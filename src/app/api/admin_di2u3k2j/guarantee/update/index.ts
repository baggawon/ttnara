import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3, deleteFileFromS3 } from "@/helpers/server/s3";
import { sanitizeStoredHtml } from "@/helpers/server/sanitizeHtml";
import { GuaranteeCurrency, GuaranteePosition } from "@/helpers/types";

const POSITION_VALUES = Object.values(GuaranteePosition) as string[];
const CURRENCY_VALUES = Object.values(GuaranteeCurrency) as string[];

const getKnownRegionNames = async (
  existing: string[]
): Promise<Set<string>> => {
  // Accept any name currently active OR any name already stored on this row —
  // so editing an unrelated field on a company that uses a now-inactive region
  // doesn't silently strip the region.
  const rows = await handleConnect((prisma) =>
    prisma.guarantee_region.findMany({
      where: {
        OR: [{ is_active: true }, { name: { in: existing } }],
      },
      select: { name: true },
    })
  );
  const allowed = new Set((rows ?? []).map((r) => r.name));
  // Existing values not in the table at all (orphaned labels from hard delete)
  // are still preserved so the row's data isn't lost on save.
  existing.forEach((n) => allowed.add(n));
  return allowed;
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

    const id = parseInt(formData.get("id") as string);
    const title = (formData.get("title") as string)?.trim();
    const business_name = (formData.get("business_name") as string)?.trim();
    const telegram_url = (formData.get("telegram_url") as string)?.trim();
    const no_website = formData.get("no_website") === "true";
    const url = (formData.get("url") as string)?.trim() || "";
    const deposit = (formData.get("deposit") as string)?.trim();
    const rawRegions = parseStringArray(
      formData.get("regions") as string | null
    );
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
    // Strip CloudFront signatures (description is signed on read, so editor
    // round-trips must not persist an expiring signature) and sanitize.
    const description = sanitizeStoredHtml(
      (formData.get("description") as string) ?? ""
    );
    const descriptionFormatRaw = (
      formData.get("description_format") as string | null
    )?.trim();
    const description_format =
      descriptionFormatRaw === "markdown" ? "markdown" : "html";

    if (!id || !title || !business_name || !telegram_url || !deposit) {
      return {
        result: false,
        message: "필수 입력 항목이 누락되었습니다.",
      };
    }

    if (rawRegions.length === 0) {
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

    const current = await handleConnect((prisma) =>
      prisma.guarantee_company.findUnique({ where: { id } })
    );

    if (!current) {
      return { result: false, message: "공식보증업체를 찾을 수 없습니다." };
    }

    const knownRegions = await getKnownRegionNames(current.regions);
    const regions = rawRegions.filter((r) => knownRegions.has(r));
    if (regions.length === 0) {
      return { result: false, message: "지역을 최소 하나 이상 선택해주세요." };
    }

    let public_image_url = current.public_image_url;
    let image_url = current.image_url;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > IMAGE_MAX_BYTES) {
        return {
          result: false,
          message: "이미지 크기가 너무 큽니다 (최대 20MB)",
        };
      }
      if (current.image_url) {
        try {
          await deleteFileFromS3(current.image_url);
        } catch (deleteError) {
          console.error("Old image deletion error:", deleteError);
        }
      }

      try {
        const uploadResult = await uploadFileToS3(imageFile, "guarantee/items");
        public_image_url = uploadResult.filename;
        image_url = uploadResult.aws_url;
      } catch (uploadError) {
        console.error("Guarantee image upload error:", uploadError);
        return { result: false, message: "이미지 업로드에 실패했습니다." };
      }
    }

    const updateResult = await handleConnect((prisma) =>
      prisma.guarantee_company.update({
        where: { id },
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

    if (!updateResult) throw ToastData.guaranteeUpdateFailed;

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
