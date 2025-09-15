import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3, deleteFileFromS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export const POST = async (formData: FormData) => {
  try {
    await requestValidator([RequestValidator.Admin], formData);

    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const display_order =
      parseInt(formData.get("display_order") as string) || 1;
    const is_active = formData.get("is_active") === "true";
    const bannerImageFile = formData.get("bannerImage") as File | null;
    const partnerImageFile = formData.get("partnerImage") as File | null;
    const removeBannerImage = formData.get("removeBannerImage") === "true";
    const removePartnerImage = formData.get("removePartnerImage") === "true";

    if (!id || !name || !url) {
      return {
        result: false,
        message: "ID, 이름과 URL은 필수 입력 항목입니다.",
      };
    }

    // Get current partner data
    const currentPartner = await handleConnect((prisma) =>
      prisma.partner.findUnique({
        where: { id },
      })
    );

    if (!currentPartner) {
      return {
        result: false,
        message: "파트너를 찾을 수 없습니다.",
      };
    }

    const imageUrls = {
      public_banner_image_url: currentPartner.public_banner_image_url,
      banner_image_url: currentPartner.banner_image_url,
      public_partner_image_url: currentPartner.public_partner_image_url,
      partner_image_url: currentPartner.partner_image_url,
    };

    // Handle banner image removal
    if (removeBannerImage && currentPartner.banner_image_url) {
      try {
        await deleteFileFromS3(currentPartner.banner_image_url);
        imageUrls.public_banner_image_url = "";
        imageUrls.banner_image_url = "";
      } catch (deleteError) {
        console.error("Banner image deletion error:", deleteError);
        // Continue with update even if deletion fails
      }
    }

    // Handle partner image removal
    if (removePartnerImage && currentPartner.partner_image_url) {
      try {
        await deleteFileFromS3(currentPartner.partner_image_url);
        imageUrls.public_partner_image_url = "";
        imageUrls.partner_image_url = "";
      } catch (deleteError) {
        console.error("Partner image deletion error:", deleteError);
        // Continue with update even if deletion fails
      }
    }

    // Handle new banner image upload
    if (bannerImageFile && bannerImageFile.size > 0) {
      try {
        // Delete old banner image if exists
        if (currentPartner.banner_image_url && !removeBannerImage) {
          try {
            await deleteFileFromS3(currentPartner.banner_image_url);
          } catch (deleteError) {
            console.error("Old banner image deletion error:", deleteError);
          }
        }

        const uploadResult = await uploadFileToS3(
          bannerImageFile,
          "partners/banners"
        );
        imageUrls.public_banner_image_url = uploadResult.aws_cloud_front_url;
        imageUrls.banner_image_url = uploadResult.aws_url;
      } catch (uploadError) {
        console.error("Banner image upload error:", uploadError);
        return {
          result: false,
          message: "배너 이미지 업로드에 실패했습니다.",
        };
      }
    }

    // Handle new partner image upload
    if (partnerImageFile && partnerImageFile.size > 0) {
      try {
        // Delete old partner image if exists
        if (currentPartner.partner_image_url && !removePartnerImage) {
          try {
            await deleteFileFromS3(currentPartner.partner_image_url);
          } catch (deleteError) {
            console.error("Old partner image deletion error:", deleteError);
          }
        }

        const uploadResult = await uploadFileToS3(
          partnerImageFile,
          "partners/logos"
        );
        imageUrls.public_partner_image_url = uploadResult.aws_cloud_front_url;
        imageUrls.partner_image_url = uploadResult.aws_url;
      } catch (uploadError) {
        console.error("Partner image upload error:", uploadError);
        return {
          result: false,
          message: "파트너 이미지 업로드에 실패했습니다.",
        };
      }
    }

    const updateResult = await handleConnect((prisma) =>
      prisma.partner.update({
        where: { id },
        data: {
          name,
          url,
          display_order,
          is_active,
          ...imageUrls,
        },
      })
    );

    if (!updateResult) throw ToastData.partnerUpdateFailed;

    await appCache.refreshCache(CacheKey.Partners);

    return {
      result: true,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
