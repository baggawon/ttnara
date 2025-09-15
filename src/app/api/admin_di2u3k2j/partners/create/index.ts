import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { toastData, ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

// export type PartnerCreateProps = Omit<
//   partner,
//   "id" | "created_at" | "updated_at"
// >;

export const POST = async (formData: FormData) => {
  try {
    await requestValidator([RequestValidator.Admin], formData);

    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const display_order =
      parseInt(formData.get("display_order") as string) || 1;
    const is_active = formData.get("is_active") === "true";
    const bannerImageFile = formData.get("bannerImage") as File | null;
    const partnerImageFile = formData.get("partnerImage") as File | null;

    if (!name || !url) {
      return {
        result: false,
        message: "이름과 URL은 필수 입력 항목입니다.",
      };
    }

    const imageUrls = {
      public_banner_image_url: "",
      banner_image_url: "",
      public_partner_image_url: "",
      partner_image_url: "",
    };

    // Handle banner image upload
    if (bannerImageFile && bannerImageFile.size > 0) {
      try {
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

    // Handle partner image upload
    if (partnerImageFile && partnerImageFile.size > 0) {
      try {
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

    const createResult = await handleConnect((prisma) =>
      prisma.partner.create({
        data: {
          name,
          url,
          display_order,
          is_active,
          ...imageUrls,
        },
      })
    );
    if (!createResult) throw ToastData.partnerCreateFailed;

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
