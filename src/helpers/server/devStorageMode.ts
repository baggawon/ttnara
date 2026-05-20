export type StorageMode = "aws" | "minio";

export const getStorageMode = (): StorageMode =>
  process.env.NODE_ENV === "production" ? "aws" : "minio";
