import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { handleConnect } from "@/helpers/server/prisma";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";

const ORPHAN_RETENTION_MS = 24 * 60 * 60 * 1000;

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();

  const authHeader = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || authHeader !== process.env.CRON_SECRET) {
    return response.json({ result: false, message: "Unauthorized" });
  }

  const cutoff = new Date(Date.now() - ORPHAN_RETENTION_MS);

  const orphans = await handleConnect((prisma) =>
    prisma.media_upload.findMany({
      where: {
        attached_to_id: null,
        uploaded_at: { lt: cutoff },
      },
      select: { id: true, aws_cloud_front_url: true },
      take: 500,
    })
  );

  if (!orphans || orphans.length === 0) {
    return response.json({
      result: true,
      data: { scanned: 0, deletedFromS3: 0, deletedFromDb: 0 },
    });
  }

  const urls = orphans.map((o) => o.aws_cloud_front_url);
  const s3Result = await deleteMultipleFilesFromS3(urls);

  const succeededUrls = new Set(s3Result.succeeded.map((s) => s.url));
  const idsToDelete = orphans
    .filter((o) => succeededUrls.has(o.aws_cloud_front_url))
    .map((o) => o.id);

  let deletedFromDb = 0;
  if (idsToDelete.length > 0) {
    const deletion = await handleConnect((prisma) =>
      prisma.media_upload.deleteMany({
        where: { id: { in: idsToDelete } },
      })
    );
    deletedFromDb = deletion?.count ?? 0;
  }

  return response.json({
    result: true,
    data: {
      scanned: orphans.length,
      deletedFromS3: s3Result.succeeded.length,
      deletedFromDb,
      s3Failed: s3Result.failed.length,
    },
  });
};
