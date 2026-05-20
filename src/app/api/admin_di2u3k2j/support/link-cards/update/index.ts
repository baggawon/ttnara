import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3, deleteFileFromS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

const ICON_MAX_BYTES = 20 * 1024 * 1024;

export const POST = async (formData: FormData) => {
  try {
    await requestValidator([RequestValidator.Admin], formData);

    const id = parseInt((formData.get("id") as string) ?? "", 10);
    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const description =
      (formData.get("description") as string | null)?.trim() ?? "";
    const url = (formData.get("url") as string | null)?.trim() ?? "";
    const display_order =
      parseInt((formData.get("display_order") as string) ?? "0", 10) || 0;
    const is_active = formData.get("is_active") === "true";
    const opens_in_new_tab = formData.get("opens_in_new_tab") === "true";
    const iconFile = formData.get("iconImage") as File | null;
    const removeIcon = formData.get("removeIcon") === "true";

    if (!id || !title || !url) {
      return {
        result: false,
        message: ToastData.supportLinkCardUpdateFailed,
      };
    }

    const current = await handleConnect((prisma) =>
      prisma.support_link_card.findUnique({ where: { id } })
    );

    if (!current) {
      return {
        result: false,
        message: ToastData.supportLinkCardUpdateFailed,
      };
    }

    let image_url: string | null = current.image_url;
    let cloudfront_url: string | null = current.cloudfront_url;

    if (removeIcon && current.image_url) {
      try {
        await deleteFileFromS3(current.image_url);
      } catch (deleteError) {
        console.error("Old icon deletion error:", deleteError);
      }
      image_url = null;
      cloudfront_url = null;
    }

    if (iconFile && iconFile.size > 0) {
      if (iconFile.size > ICON_MAX_BYTES) {
        return {
          result: false,
          message: "아이콘 크기가 너무 큽니다 (최대 20MB)",
        };
      }
      try {
        if (current.image_url && !removeIcon) {
          try {
            await deleteFileFromS3(current.image_url);
          } catch (deleteError) {
            console.error("Old icon replacement deletion error:", deleteError);
          }
        }
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
          message: ToastData.supportLinkCardUpdateFailed,
        };
      }
    }

    const updateResult = await handleConnect((prisma) =>
      prisma.support_link_card.update({
        where: { id },
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
    if (!updateResult) throw ToastData.supportLinkCardUpdateFailed;

    await appCache.refreshCache(CacheKey.Support);

    return {
      result: true,
      message: ToastData.supportLinkCardUpdate,
    };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
