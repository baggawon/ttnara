import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3, signStoredCloudFrontUrl } from "@/helpers/server/s3";
import type { ApiReturnProps } from "@/helpers/types";

export const MEDIA_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export const ALLOWED_MEDIA_MIME_TYPES = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export interface MediaUploadResult {
  id: number;
  url: string;
  awsCloudFrontUrl: string;
  mediaType: "image" | "video";
  mimeType: string;
  sizeBytes: number;
}

export const POST = async (formData: FormData): Promise<ApiReturnProps> => {
  try {
    const { uid } = await requestValidator([RequestValidator.User], formData);
    if (!uid) throw ToastData.noAuth;

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { result: false, message: "No file provided" };
    }

    if (file.size > MEDIA_UPLOAD_MAX_BYTES) {
      return {
        result: false,
        message: `File too large (max ${MEDIA_UPLOAD_MAX_BYTES / 1024 / 1024}MB)`,
      };
    }

    const mimeType = file.type;
    if (!ALLOWED_MEDIA_MIME_TYPES.has(mimeType)) {
      return { result: false, message: `Unsupported file type: ${mimeType}` };
    }

    const mediaType: "image" | "video" = mimeType.startsWith("video/")
      ? "video"
      : "image";

    const uploaded = await uploadFileToS3(file, "media-uploads");
    if (!uploaded?.aws_cloud_front_url || !uploaded?.aws_url) {
      throw ToastData.unknown;
    }

    const row = await handleConnect((prisma) =>
      prisma.media_upload.create({
        data: {
          author_id: uid,
          aws_url: uploaded.aws_url,
          aws_cloud_front_url: uploaded.aws_cloud_front_url,
          media_type: mediaType,
          mime_type: mimeType,
          size_bytes: file.size,
        },
      })
    );
    if (!row) throw ToastData.unknown;

    const result: MediaUploadResult = {
      id: row.id,
      url: signStoredCloudFrontUrl(row.aws_cloud_front_url),
      awsCloudFrontUrl: row.aws_cloud_front_url,
      mediaType,
      mimeType,
      sizeBytes: row.size_bytes,
    };

    return { result: true, data: result };
  } catch (error) {
    console.error("media upload error:", error);
    return {
      result: false,
      message: typeof error === "string" ? error : String(error),
    };
  }
};
