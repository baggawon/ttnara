import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

const ICON_MAX_BYTES = 20 * 1024 * 1024;

export const POST = async (formData: FormData) => {
  try {
    await requestValidator([RequestValidator.Admin], formData);

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const description =
      (formData.get("description") as string | null)?.trim() ?? "";
    const url = (formData.get("url") as string | null)?.trim() ?? "";
    const display_order =
      parseInt((formData.get("display_order") as string) ?? "0", 10) || 0;
    const is_active = formData.get("is_active") === "true";
    const opens_in_new_tab = formData.get("opens_in_new_tab") === "true";
    const iconFile = formData.get("iconImage") as File | null;

    if (!title || !url) {
      return {
        result: false,
        message: ToastData.supportLinkCardCreateFailed,
      };
    }

    let image_url: string | null = null;
    let cloudfront_url: string | null = null;

    if (iconFile && iconFile.size > 0) {
      if (iconFile.size > ICON_MAX_BYTES) {
        return {
          result: false,
          message: "아이콘 크기가 너무 큽니다 (최대 20MB)",
        };
      }
      try {
        const uploadResult = await uploadFileToS3(
          iconFile,
          "support/link-cards"
        );
        image_url = uploadResult.aws_url;
        cloudfront_url = uploadResult.aws_cloud_front_url;
      } catch (uploadError) {
        console.error("Link card icon upload error:", uploadError);
        return {
          result: false,
          message: ToastData.supportLinkCardCreateFailed,
        };
      }
    }

    const createResult = await handleConnect((prisma) =>
      prisma.support_link_card.create({
        data: {
          title,
          description: description || null,
          url,
          image_url,
          cloudfront_url,
          opens_in_new_tab,
          display_order,
          is_active,
        },
      })
    );
    if (!createResult) throw ToastData.supportLinkCardCreateFailed;

    await appCache.refreshCache(CacheKey.Support);

    return {
      result: true,
      message: ToastData.supportLinkCardCreate,
    };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
