import type { guarantee_company } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";
import { getSignedCloudFrontUrl } from "@/helpers/server/s3";

export interface GuaranteeListResponse {
  items: guarantee_company[];
  pagination: PaginationInfo;
}

export interface GuaranteeReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  is_active?: boolean | "all";
  region?: string;
}

async function getGuaranteeWithPagination(
  queryParams: any
): Promise<GuaranteeListResponse> {
  const manager = paginationManager(queryParams);
  const { page, pageSize } = manager.getPageInfo();

  const where: any = {};

  if (queryParams.is_active !== undefined && queryParams.is_active !== "all") {
    where.is_active =
      queryParams.is_active === true || queryParams.is_active === "true";
  }

  if (queryParams.region && queryParams.region !== "all") {
    where.regions = { has: queryParams.region };
  }

  if (queryParams.search && queryParams.search.trim()) {
    where.OR = [
      { title: { contains: queryParams.search, mode: "insensitive" } },
      { business_name: { contains: queryParams.search, mode: "insensitive" } },
      { telegram_url: { contains: queryParams.search, mode: "insensitive" } },
    ];
  }

  const orderBy: any = [
    { display_order: queryParams?.order === "desc" ? "desc" : "asc" },
  ];
  if (queryParams.order) {
    orderBy.push({ created_at: queryParams.order });
  }

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.guarantee_company.count({ where }),
      prisma.guarantee_company.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );

  if (!result) throw ToastData.unknown;
  const [totalCount, items] = result;
  if (!items || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    items: items.map((item) => ({
      ...item,
      public_image_url: item.public_image_url
        ? getSignedCloudFrontUrl(item.public_image_url)
        : "",
    })),
    pagination: manager.getPagination(),
  };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getGuaranteeWithPagination(queryParams);
    return {
      result: true,
      data: response,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
}
