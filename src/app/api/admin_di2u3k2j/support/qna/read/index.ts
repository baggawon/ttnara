import type { support_qna, support_qna_category } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export type SupportQnaWithCategory = support_qna & {
  category: support_qna_category;
};

export interface SupportQnaListResponse {
  qnas: SupportQnaWithCategory[];
  pagination: PaginationInfo;
}

export interface SupportQnaReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  is_active?: boolean;
  category_id?: number;
  id?: number;
}

async function getQnasWithPagination(
  queryParams: any
): Promise<SupportQnaListResponse> {
  const manager = paginationManager(queryParams);

  // Single-fetch mode (for the edit page).
  if (queryParams.id !== undefined && queryParams.id !== null) {
    const numericId = Number(queryParams.id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw ToastData.unknown;
    }
    const qna = await handleConnect((prisma) =>
      prisma.support_qna.findUnique({
        where: { id: numericId },
        include: { category: true },
      })
    );
    if (!qna) throw ToastData.unknown;
    return {
      qnas: [qna],
      pagination: manager.getPagination(),
    };
  }

  const { page, pageSize } = manager.getPageInfo();

  const where: any = {};

  if (queryParams.is_active !== undefined && queryParams.is_active !== "all") {
    where.is_active =
      queryParams.is_active === true || queryParams.is_active === "true";
  }

  if (
    queryParams.category_id !== undefined &&
    queryParams.category_id !== "" &&
    queryParams.category_id !== "all"
  ) {
    const catId = Number(queryParams.category_id);
    if (Number.isFinite(catId) && catId > 0) where.category_id = catId;
  }

  if (queryParams.search && queryParams.search.trim()) {
    where.question = { contains: queryParams.search, mode: "insensitive" };
  }

  const orderBy: any = [
    { category_id: "asc" },
    { display_order: queryParams?.order === "desc" ? "desc" : "asc" },
    { id: "desc" },
  ];

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.support_qna.count({ where }),
      prisma.support_qna.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true },
      }),
    ])
  );

  if (!result) throw ToastData.unknown;
  const [totalCount, qnas] = result;
  if (!qnas || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    qnas,
    pagination: manager.getPagination(),
  };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getQnasWithPagination(queryParams);
    return { result: true, data: response };
  } catch (error) {
    return { result: false, message: String(error) };
  }
}
