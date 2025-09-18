import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";

export interface PopupDeleteProps {
  id?: string;
  ids?: number[];
}

export const POST = async (json: PopupDeleteProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    let idsToDelete: number[] = [];

    if (json.id) {
      idsToDelete = [parseInt(json.id)];
    } else if (json.ids && json.ids.length > 0) {
      idsToDelete = json.ids;
    } else {
      throw ToastData.unknown;
    }

    const existingPopups = await handleConnect((prisma) =>
      prisma.popup.findMany({
        where: { id: { in: idsToDelete } },
      })
    );

    if (!existingPopups || existingPopups.length === 0) throw ToastData.unknown;

    // 이미지가 있으면 S3에서 삭제 (aws_url 우선, 없으면 cloud_front_url 사용)
    const imageUrls = existingPopups
      .filter((popup) => popup.image_aws_url || popup.image_cloud_front_url)
      .map((popup) => popup.image_aws_url || popup.image_cloud_front_url!);

    if (imageUrls.length > 0) {
      await deleteMultipleFilesFromS3(imageUrls);
    }

    const deleteResult = await handleConnect((prisma) =>
      prisma.popup.deleteMany({
        where: { id: { in: idsToDelete } },
      })
    );

    if (!deleteResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.Popups);

    return {
      result: true,
      isSuccess: true,
      hasMessage: "팝업이 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: "팝업 삭제 중 오류가 발생했습니다.",
      message: String(error),
    };
  }
};
