import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";

export interface GuaranteeDeleteProps {
  ids: number[];
}

export const POST = async (json: GuaranteeDeleteProps) => {
  try {
    if (!json?.ids || !Array.isArray(json.ids) || json.ids.length === 0) {
      return {
        result: false,
        message: "공식보증업체 ID가 필요합니다.",
      };
    }

    await requestValidator([RequestValidator.Admin], json);

    const toDelete = await handleConnect((prisma) =>
      prisma.guarantee_company.findMany({
        where: { id: { in: json.ids } },
        select: { id: true, image_url: true },
      })
    );

    if (!toDelete || toDelete.length === 0) {
      return {
        result: false,
        message: "제공된 ID로 공식보증업체를 찾을 수 없습니다.",
      };
    }

    const imageUrlsToDelete = toDelete
      .map((i) => i.image_url)
      .filter((u): u is string => !!u && u.trim() !== "");

    const deleteResult = await handleConnect((prisma) =>
      prisma.guarantee_company.deleteMany({
        where: { id: { in: json.ids } },
      })
    );

    if (!deleteResult) throw ToastData.guaranteeDeleteFailed;

    if (imageUrlsToDelete.length > 0) {
      try {
        await deleteMultipleFilesFromS3(imageUrlsToDelete);
      } catch (s3Error) {
        console.error("S3 deletion error:", s3Error);
      }
    }

    return { result: true };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
