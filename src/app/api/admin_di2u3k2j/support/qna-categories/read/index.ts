import type { support_qna_category } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface SupportQnaCategoriesListResponse {
  categories: (support_qna_category & { _count: { qnas: number } })[];
  pagination: PaginationInfo;
}

export interface SupportQnaCategoriesReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  is_active?: boolean;
}

async function getCategoriesWithPagination(
  queryParams: any
): Promise<SupportQnaCategoriesListResponse> {
  const manager = paginationManager(queryParams);
  const { page, pageSize } = manager.getPageInfo();

  const where: any = {};

  if (queryParams.is_active !== undefined && queryParams.is_active !== "all") {
    where.is_active =
      queryParams.is_active === true || queryParams.is_active === "true";
  }

  if (queryParams.search && queryParams.search.trim()) {
    where.name = { contains: queryParams.search, mode: "insensitive" };
  }

  const orderBy: any = [
    { display_order: queryParams?.order === "desc" ? "desc" : "asc" },
  ];

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.support_qna_category.count({ where }),
      prisma.support_qna_category.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { qnas: true } } },
      }),
    ])
  );

  if (!result) throw ToastData.unknown;
  const [totalCount, categories] = result;
  if (!categories || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    categories,
    pagination: manager.getPagination(),
  };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getCategoriesWithPagination(queryParams);
    return { result: true, data: response };
  } catch (error) {
    return { result: false, message: String(error) };
  }
}
