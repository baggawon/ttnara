import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3, deleteFileFromS3 } from "@/helpers/server/s3";

const IMAGE_MAX_BYTES = 20 * 1024 * 1024;

export const POST = async (formData: FormData) => {
  try {
    await requestValidator([RequestValidator.Admin], formData);

    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") === "true";

    const current = await handleConnect((prisma) =>
      prisma.guarantee_page_setting.findUnique({ where: { id: 1 } })
    );

    let public_hero_image_url: string | null =
      current?.public_hero_image_url ?? null;
    let hero_image_url: string | null = current?.hero_image_url ?? null;

    if (removeImage && hero_image_url) {
      try {
        await deleteFileFromS3(hero_image_url);
      } catch (deleteError) {
        console.error("Hero image deletion error:", deleteError);
      }
      public_hero_image_url = null;
      hero_image_url = null;
    }

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > IMAGE_MAX_BYTES) {
        return {
          result: false,
          message: "이미지 크기가 너무 큽니다 (최대 20MB)",
        };
      }
      if (hero_image_url && !removeImage) {
        try {
          await deleteFileFromS3(hero_image_url);
        } catch (deleteError) {
          console.error("Old hero image deletion error:", deleteError);
        }
      }
      try {
        const uploadResult = await uploadFileToS3(imageFile, "guarantee/hero");
        public_hero_image_url = uploadResult.filename;
        hero_image_url = uploadResult.aws_url;
      } catch (uploadError) {
        console.error("Hero image upload error:", uploadError);
        return { result: false, message: "배너 이미지 업로드에 실패했습니다." };
      }
    }

    const saveResult = await handleConnect((prisma) =>
      prisma.guarantee_page_setting.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          public_hero_image_url,
          hero_image_url,
        },
        update: {
          public_hero_image_url,
          hero_image_url,
        },
      })
    );

    if (!saveResult) throw ToastData.guaranteeBannerUpdateFailed;

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
