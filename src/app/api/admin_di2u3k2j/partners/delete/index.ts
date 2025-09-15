import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { toastData, ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface PartnersDeleteProps {
  ids: number[];
}

export const POST = async (json: PartnersDeleteProps) => {
  try {
    if (!json?.ids || !Array.isArray(json.ids) || json.ids.length === 0) {
      return {
        result: false,
        message: "파트너 ID가 필요합니다.",
      };
    }

    await requestValidator([RequestValidator.Admin], json);

    // Get partners with images to delete
    const partnersToDelete = await handleConnect((prisma) =>
      prisma.partner.findMany({
        where: { id: { in: json.ids } },
        select: {
          id: true,
          banner_image_url: true,
          partner_image_url: true,
        },
      })
    );

    if (!partnersToDelete || partnersToDelete.length === 0) {
      return {
        result: false,
        message: "제공된 ID로 파트너를 찾을 수 없습니다.",
      };
    }

    // Collect image URLs to delete
    const imageUrlsToDelete: string[] = [];

    partnersToDelete.forEach((partner) => {
      if (partner.banner_image_url && partner.banner_image_url.trim() !== "") {
        imageUrlsToDelete.push(partner.banner_image_url);
      }
      if (
        partner.partner_image_url &&
        partner.partner_image_url.trim() !== ""
      ) {
        imageUrlsToDelete.push(partner.partner_image_url);
      }
    });

    // Delete partners from database
    const deleteResult = await handleConnect((prisma) =>
      prisma.partner.deleteMany({
        where: { id: { in: json.ids } },
      })
    );

    if (!deleteResult) throw ToastData.partnerDeleteFailed;

    // Delete images from S3 (don't fail the request if this fails)
    if (imageUrlsToDelete.length > 0) {
      try {
        await deleteMultipleFilesFromS3(imageUrlsToDelete);
      } catch (s3Error) {
        console.error("S3 deletion error:", s3Error);
        // Continue with success response even if S3 deletion fails
      }
    }

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
