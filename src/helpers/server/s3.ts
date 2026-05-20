import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import crypto from "crypto";
import { map, now } from "@/helpers/basic";
import {
  getStorageMode,
  type StorageMode,
} from "@/helpers/server/devStorageMode";

let awsClient: S3Client | null = null;
let minioClient: S3Client | null = null;

const getAwsClient = (): S3Client => {
  if (!awsClient) {
    awsClient = new S3Client({
      region: process.env.AWS_REGION!,
    });
  }
  return awsClient;
};

const getMinioClient = (): S3Client => {
  if (!minioClient) {
    minioClient = new S3Client({
      region: "us-east-1",
      endpoint: process.env.MINIO_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
      },
    });
  }
  return minioClient;
};

const isMinioUrl = (url: string): boolean => {
  const endpoint = process.env.MINIO_ENDPOINT;
  if (!endpoint) return false;
  try {
    return url.includes(new URL(endpoint).host);
  } catch {
    return false;
  }
};

const buildMinioPublicUrl = (filename: string): string =>
  `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${filename}`;

// Signs a CloudFront URL using the key pair configured in env.
// In MinIO dev mode, returns the MinIO public URL instead — files live there, not on CloudFront.
// expiresIn: seconds until expiry (default 86400 = 1 day)
export const getSignedCloudFrontUrl = (
  filename: string,
  expiresIn = 86400
): string => {
  if (getStorageMode() === "minio") {
    return buildMinioPublicUrl(filename);
  }

  const privateKey = (process.env.CLOUDFRONT_PRIVATE_KEY ?? "").replace(
    /\\n/g,
    "\n"
  );
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!;
  const domain = process.env.CLOUDFRONT_DOMAIN ?? "";
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const url = `${baseUrl}/${filename}`;
  const dateLessThan = new Date(Date.now() + expiresIn * 1000).toISOString();

  return getSignedUrl({ url, keyPairId, privateKey, dateLessThan });
};

// Strips CloudFront signing query params from URLs in HTML (before saving to DB)
export const stripCloudFrontSignatures = (html: string): string => {
  const domain = process.env.CLOUDFRONT_DOMAIN ?? "";
  if (!domain) return html;

  const pattern = new RegExp(
    `(https?://${domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[^"'\\s<>?]+)\\?[^"'\\s<>]*`,
    "g"
  );

  return html.replace(pattern, "$1");
};

// Signs all CloudFront URLs found in an HTML string
export const signCloudFrontUrlsInHtml = (html: string): string => {
  const domain = process.env.CLOUDFRONT_DOMAIN ?? "";
  if (!domain) return html;

  const pattern = new RegExp(
    `(https?://${domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[^"'\\s<>]+)`,
    "g"
  );

  return html.replace(pattern, (url) => {
    try {
      const filename = url.replace(/^https?:\/\/[^/]+\//, "");
      return getSignedCloudFrontUrl(filename);
    } catch {
      return url;
    }
  });
};

// Signs a stored aws_cloud_front_url (without protocol) and returns full signed URL
export const signStoredCloudFrontUrl = (storedUrl: string): string => {
  const domain = process.env.CLOUDFRONT_DOMAIN ?? "";
  // MinIO/dev-uploaded URLs and any URL not pointing at our CloudFront domain
  // should pass through unsigned — there's no signer for them.
  if (!domain || !storedUrl.includes(domain)) {
    return storedUrl.startsWith("http") ? storedUrl : `https://${storedUrl}`;
  }
  try {
    const filename = storedUrl.replace(
      new RegExp(
        `^(https?://)?${domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?`
      ),
      ""
    );
    return getSignedCloudFrontUrl(filename);
  } catch {
    return `https://${storedUrl}`;
  }
};

export const uploadFileToS3 = async (file: File, folderPath = "") => {
  const mode: StorageMode = getStorageMode();
  const timestamp = now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const folder = folderPath ? `${folderPath.replace(/\/$/, "")}/` : "";

  const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
  const filename = `${folder}${timestamp.format("YYYYMMDDHHmmss")}-${randomString}${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (mode === "minio") {
    const bucket = process.env.MINIO_BUCKET!;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    });
    try {
      await getMinioClient().send(command);
      const publicUrl = buildMinioPublicUrl(filename);
      return {
        filename,
        aws_cloud_front_url: publicUrl,
        aws_url: publicUrl,
      };
    } catch (error) {
      console.error("MinIO upload error:", error);
      throw new Error("Failed to upload file to MinIO");
    }
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
    ACL: "private",
  });

  try {
    await getAwsClient().send(command);
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

const extractKeyFromUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const key = urlObj.pathname.replace(/^\//, "");
    return decodeURIComponent(key);
  } catch (error) {
    console.error("URL 파싱 에러:", error);
    throw new Error("Invalid URL format");
  }
};

export const deleteFileFromS3 = async (url: string) => {
  try {
    if (isMinioUrl(url)) {
      // MinIO URLs are path-style: http://host:port/{bucket}/{key...}
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.replace(/^\//, "");
      const bucket = process.env.MINIO_BUCKET!;
      const prefix = `${bucket}/`;
      const key = decodeURIComponent(
        pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname
      );
      await getMinioClient().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key })
      );
      return { success: true, deletedKey: key };
    }

    const key = extractKeyFromUrl(url);
    await getAwsClient().send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
      })
    );
    return { success: true, deletedKey: key };
  } catch (error) {
    console.error("S3 삭제 에러:", error);
    throw new Error(`Failed to delete file: ${url}`);
  }
};

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
