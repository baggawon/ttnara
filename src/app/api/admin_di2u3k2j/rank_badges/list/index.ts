import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";

export interface RankBadgeListItem {
  id: number;
  name: string | null;
  url: string;
  aws_cloud_front_url: string;
  mime_type: string;
  size_bytes: number;
  assigned_min_rank: number | null;
  assigned_max_rank: number | null;
  created_at: Date;
}

export interface RankBadgeListResponse {
  badges: RankBadgeListItem[];
}

export const GET = async (queryParams: any) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const rows = await handleConnect((prisma) =>
      prisma.rank_badge_image.findMany({
        orderBy: [
          { assigned_min_rank: { sort: "asc", nulls: "last" } },
          { created_at: "desc" },
        ],
      })
    );
    if (!rows) throw ToastData.unknown;

    const badges: RankBadgeListItem[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: signStoredCloudFrontUrl(row.aws_cloud_front_url),
      aws_cloud_front_url: row.aws_cloud_front_url,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      assigned_min_rank: row.assigned_min_rank,
      assigned_max_rank: row.assigned_max_rank,
      created_at: row.created_at,
    }));

    return { result: true, data: { badges } as RankBadgeListResponse };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
