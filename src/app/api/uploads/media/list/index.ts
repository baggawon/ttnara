import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";
import type { ApiReturnProps } from "@/helpers/types";
import type { MediaUploadResult } from "@/app/api/uploads/media";

export const GET = async (query: {
  attached_to_type?: string;
  attached_to_id?: string | number;
}): Promise<ApiReturnProps> => {
  try {
    const { uid } = await requestValidator([RequestValidator.User], query);
    if (!uid) throw ToastData.noAuth;

    const attachedToType = query.attached_to_type;
    const attachedToId = Number(query.attached_to_id);
    if (
      !attachedToType ||
      !Number.isFinite(attachedToId) ||
      attachedToId <= 0
    ) {
      return { result: false, message: "Invalid attachment reference" };
    }

    const rows = await handleConnect((prisma) =>
      prisma.media_upload.findMany({
        where: {
          attached_to_type: attachedToType,
          attached_to_id: attachedToId,
        },
        orderBy: { uploaded_at: "asc" },
      })
    );

    const data: MediaUploadResult[] = (rows ?? []).map((row) => ({
      id: row.id,
      url: signStoredCloudFrontUrl(row.aws_cloud_front_url),
      awsCloudFrontUrl: row.aws_cloud_front_url,
      mediaType: row.media_type === "video" ? "video" : "image",
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
    }));

    return { result: true, data };
  } catch (error) {
    console.error("media list error:", error);
    return {
      result: false,
      message: typeof error === "string" ? error : String(error),
    };
  }
};
