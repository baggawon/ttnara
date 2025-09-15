import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { Prisma, thread } from "@prisma/client";
import { forEach, map, removeColumnsFromObject } from "@/helpers/basic";
import { deleteMultipleFilesFromS3, uploadFileToS3 } from "@/helpers/server/s3";
import { BoardAccessService } from "@/lib/boardAccess";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
export interface threadUpdateProps extends thread {}

export const POST = async (formData: FormData) => {
  try {
    const jsonString = formData.get("json");
    if (!jsonString || !formData.get("topic_url")) throw ToastData.unknown;
    const json: threadUpdateProps = JSON.parse(jsonString as string);
    if (typeof json?.id !== "number" || !json.content) throw ToastData.unknown;

    const topic_url = formData.get("topic_url") as string;

    const { uid, session } = await requestValidator(
      [RequestValidator.User],
      formData
    );
    const author_id = uid!;

    try {
      const topics = appCache.getByKey(CacheKey.Topics) as any;
      const topicSettings = topics[topic_url];

      const access = await BoardAccessService.fromSession({
        session,
        topic_url,
        thread_id: json.id,
        topicSettings,
      });

      // 새글이라면
      if (json.id === 0 && !access.canWrite()) {
        return {
          result: false,
          message: "글 작성 권한이 없습니다",
        };
      }
      // 기존 글이라면
      if (json.id > 0 && !access.canEdit()) {
        return {
          result: false,
          message: "글 수정 권한이 없습니다",
        };
      }
      // 글 제목 검증
      if (!access.validateTitle(json.title)) {
        return {
          result: false,
          message: "글 제목이 최소/최대 범위를 벗어났습니다.",
        };
      }
      // 글 내용 검증
      if (!access.validateContent(json.content)) {
        return {
          result: false,
          message: "글 내용이 최소/최대 범위를 벗어났습니다.",
        };
      }

      // Continue with creating thread...
    } catch (error) {
      return {
        result: false,
        message: ToastData.threadAccessControlError,
      };
    }

    // 미디어 파일 처리
    const mediaFiles = formData.getAll("mediaFiles") as File[] | undefined;

    const uploadedMedia: {
      author_id: string;
      aws_url: string;
      aws_cloud_front_url: string;
      media_type: "image" | "video";
      mime_type: string;
    }[] = [];

    if (mediaFiles) {
      const urls = await Promise.all(
        map(mediaFiles, async (mediaFile, index) => {
          const metaDataStr = formData.get(`mediaMeta_${index}`);
          let mediaType = "image";
          let metadata = {};

          if (metaDataStr) {
            try {
              const metaData = JSON.parse(metaDataStr as string);
              mediaType = metaData.type || "image";
              metadata = metaData;
            } catch (e) {
              console.error("메타데이터 파싱 오류:", e);
            }
          } else {
            // 파일명으로 타입 추정
            mediaType = mediaFile.name.startsWith("video_") ? "video" : "image";
          }

          // S3 업로드 함수 호출
          const { aws_cloud_front_url, aws_url } = await uploadFileToS3(
            mediaFile,
            topic_url
          );

          return {
            aws_cloud_front_url,
            aws_url,
            media_type: mediaType,
            mime_type: mediaFile.type,
            metadata: metaDataStr ? (metaDataStr as string) : undefined,
          };
        })
      );

      forEach(
        urls,
        ({ aws_cloud_front_url, aws_url, media_type, mime_type, metadata }) =>
          uploadedMedia.push({
            aws_cloud_front_url,
            aws_url,
            author_id,
            media_type,
            mime_type,
          })
      );

      // HTML 내 미디어 참조 대체
      if (uploadedMedia.length > 0) {
        forEach(uploadedMedia, (media, index) => {
          if (media.media_type === "image") {
            json.content = json.content!.replace(
              `data-media-ref="${index}" data-media-type="image"`,
              `src="https://${media.aws_cloud_front_url}" alt="thread image"`
            );
          } else if (media.media_type === "video") {
            const mimeType = media.mime_type || "video/mp4";

            // 기존 비디오 태그 처리
            json.content = json.content!.replace(
              `<video controls data-media-ref="${index}" data-media-type="video"></video>`,
              `<video controls width="100%">
                <source src="https://${media.aws_cloud_front_url}" type="${mimeType}">
                브라우저가 비디오 태그를 지원하지 않습니다.
              </video>`
            );

            // 추가: CKEditor의 mediaEmbed 형식 처리
            json.content = json.content!.replace(
              `<figure class="media"><div data-media-ref="${index}" data-media-type="video"></div></figure>`,
              `<figure class="media">
                <div data-oembed-url="https://${media.aws_cloud_front_url}">
                  <video controls width="100%" style="max-width: 100%; border-radius: 4px;">
                    <source src="https://${media.aws_cloud_front_url}" type="${mimeType}">
                    브라우저가 HTML5 비디오를 지원하지 않습니다.
                  </video>
                </div>
              </figure>`
            );
          }
        });
      }
    }
    if (json.id === 0) {
      const lastThread = await handleConnect((prisma) =>
        prisma.thread.findFirst({
          where: { topic_id: json.topic_id },
          select: { topic_order: true },
          orderBy: { topic_order: "desc" },
        })
      );
      const topic_order = lastThread ? lastThread.topic_order + 1 : 1;
      const data: Prisma.XOR<
        Prisma.threadCreateInput,
        Prisma.threadUncheckedCreateInput
      > = {
        ...removeColumnsFromObject(json, [
          "author",
          "id",
          "comments",
          "created_at",
          "updated_at",
          "images",
        ]),
        author_id,
        topic_order,
        ...(uploadedMedia.length > 0 && {
          images: { createMany: { data: uploadedMedia } },
        }),
      };
      try {
        const createResult = await handleConnect((prisma) =>
          prisma.thread.create({
            data,
          })
        );
        if (!createResult) throw ToastData.threadCreatePrismaError;
      } catch (error) {
        data.topic_order = data.topic_order + 1;
        const createResult = await handleConnect((prisma) =>
          prisma.thread.create({
            data,
          })
        );
        if (!createResult) throw ToastData.threadCreatePrismaError;
      }
    } else {
      if (formData.get("toDelete")) {
        const toDelete = JSON.parse(formData.get("toDelete") as string) as {
          aws_cloud_front_url: string;
        }[];

        if (toDelete.length > 0) {
          const toDeleteWithProtocol = toDelete.map(
            (image) => `https://${image.aws_cloud_front_url}`
          );

          const results = await deleteMultipleFilesFromS3(toDeleteWithProtocol);
          if (results.failed.length > 0) {
            throw ToastData.unknown;
          }

          await handleConnect((prisma) =>
            prisma.thread_image.deleteMany({
              where: {
                aws_cloud_front_url: {
                  in: toDelete.map((image) => image.aws_cloud_front_url),
                },
              },
            })
          );
        }
      }
      const updateResult = await handleConnect((prisma) =>
        prisma.thread.update({
          where: {
            id: json.id,
          },
          data: {
            ...removeColumnsFromObject(json, [
              "author",
              "id",
              "comments",
              "created_at",
              "updated_at",
              "images",
              "topic",
              "views",
              "upvotes",
              "downvotes",
              "author_id",
            ]),
            ...(uploadedMedia.length > 0 && {
              images: { createMany: { data: uploadedMedia } },
            }),
          },
        })
      );

      if (!updateResult) throw ToastData.unknown;
    }

    return {
      result: true,
      message: json.id === 0 ? ToastData.threadCreate : ToastData.threadUpdate,
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
