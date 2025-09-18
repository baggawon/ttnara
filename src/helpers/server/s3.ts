import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import { map, now } from "@/helpers/basic";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY!,
  },
});

export const uploadFileToS3 = async (file: File, folderPath = "") => {
  // 파일 이름에 타임스탬프와 랜덤 문자열 추가
  const timestamp = now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const folder = folderPath ? `${folderPath.replace(/\/$/, "")}/` : "";

  const filename = `${folder}${timestamp.format("YYYYMMDDHHmmss")}-${randomString}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
    ACL: "private",
  });

  try {
    await s3Client.send(command);
    return {
      filename,
      aws_cloud_front_url: `${process.env.CLOUDFRONT_DOMAIN}/${filename}`,
      aws_url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload file to S3");
  }
};

// CloudFront URL에서 S3 키 추출
const extractKeyFromUrl = (url: string) => {
  try {
    // URL에서 도메인 이후의 경로 추출
    const urlObj = new URL(url);
    // CloudFront 도메인 제거하고 앞의 '/' 제거
    const key = urlObj.pathname.replace(/^\//, "");
    return decodeURIComponent(key); // URL 인코딩 디코드
  } catch (error) {
    console.error("URL 파싱 에러:", error);
    throw new Error("Invalid URL format");
  }
};

// 단일 파일 삭제
export const deleteFileFromS3 = async (url: string) => {
  try {
    const key = extractKeyFromUrl(url);

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(command);
    return {
      success: true,
      deletedKey: key,
    };
  } catch (error) {
    console.error("S3 삭제 에러:", error);
    throw new Error(`Failed to delete file: ${url}`);
  }
};

// 여러 파일 삭제
export const deleteMultipleFilesFromS3 = async (urls: string[]) => {
  const results: {
    succeeded: { url: string; key: string }[];
    failed: { url: string; error: string }[];
  } = {
    succeeded: [],
    failed: [],
  };

  await Promise.all(
    map(urls, async (url) => {
      try {
        const result = await deleteFileFromS3(url);
        results.succeeded.push({
          url,
          key: result.deletedKey,
        });
      } catch (error: any) {
        results.failed.push({
          url,
          error: error.message,
        });
      }
    })
  );

  return results;
};
