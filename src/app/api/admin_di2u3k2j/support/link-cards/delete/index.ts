import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface SupportLinkCardsDeleteProps {
  ids: number[];
}

export const POST = async (json: SupportLinkCardsDeleteProps) => {
  try {
    if (!json?.ids || !Array.isArray(json.ids) || json.ids.length === 0) {
      return {
        result: false,
        message: ToastData.supportLinkCardDeleteFailed,
      };
    }

    await requestValidator([RequestValidator.Admin], json);

    const cardsToDelete = await handleConnect((prisma) =>
      prisma.support_link_card.findMany({
        where: { id: { in: json.ids } },
        select: { id: true, image_url: true },
      })
    );

    if (!cardsToDelete || cardsToDelete.length === 0) {
      return {
        result: false,
        message: ToastData.supportLinkCardDeleteFailed,
      };
    }

    const imageUrlsToDelete: string[] = cardsToDelete
      .map((c) => c.image_url)
      .filter((u): u is string => !!u && u.trim() !== "");

    const deleteResult = await handleConnect((prisma) =>
      prisma.support_link_card.deleteMany({ where: { id: { in: json.ids } } })
    );

    if (!deleteResult) throw ToastData.supportLinkCardDeleteFailed;

    if (imageUrlsToDelete.length > 0) {
      try {
        await deleteMultipleFilesFromS3(imageUrlsToDelete);
      } catch (s3Error) {
        console.error("S3 deletion error:", s3Error);
      }
    }

    await appCache.refreshCache(CacheKey.Support);

    return {
      result: true,
      message: ToastData.supportLinkCardDelete,
    };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
