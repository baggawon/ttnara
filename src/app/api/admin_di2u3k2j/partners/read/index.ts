import type { partner } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface PartnersListResponse {
  partners: partner[];
  pagination: PaginationInfo;
}

export interface PartnersReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  is_active?: boolean;
}

async function getPartnersWithPagination(
  queryParams: any
): Promise<PartnersListResponse> {
  const manager = paginationManager(queryParams);
  const { page, pageSize } = manager.getPageInfo();

  const where: any = {};

  if (queryParams.is_active !== undefined && queryParams.is_active !== "all") {
    where.is_active =
      queryParams.is_active === true || queryParams.is_active === "true";
  }

  if (queryParams.search && queryParams.search.trim()) {
    where.OR = [
      { name: { contains: queryParams.search, mode: "insensitive" } },
      { url: { contains: queryParams.search, mode: "insensitive" } },
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
      prisma.partner.count({ where }),
      prisma.partner.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );

  if (!result) throw ToastData.unknown;
  const [totalCount, partners] = result;
  if (!partners || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    partners,
    pagination: manager.getPagination(),
  };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getPartnersWithPagination(queryParams);
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
