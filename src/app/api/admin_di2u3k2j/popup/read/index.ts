import type { popup } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface PopupListResponse {
  popups: popup[];
  pagination: PaginationInfo;
}

export interface PopupReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  is_active?: boolean;
}

async function getPopupsWithPagination(
  queryParams: any
): Promise<PopupListResponse> {
  const manager = paginationManager(queryParams);
  const { page, pageSize } = manager.getPageInfo();

  const where: any = {};
  const now = new Date();

  if (queryParams.is_active !== undefined && queryParams.is_active !== "all") {
    where.is_active =
      queryParams.is_active === true || queryParams.is_active === "true";
  }

  if (queryParams.search && queryParams.search.trim()) {
    where.OR = [
      { title: { contains: queryParams.search, mode: "insensitive" } },
      { content: { contains: queryParams.search, mode: "insensitive" } },
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
      prisma.popup.count({ where }),
      prisma.popup.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );

  if (!result) throw ToastData.unknown;
  const [totalCount, popups] = result;
  if (!popups || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    popups,
    pagination: manager.getPagination(),
  };
}

export const GET = async (queryParams: PopupReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getPopupsWithPagination(queryParams);
    return {
      result: true,
      isSuccess: true,
      data: response,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: "팝업 목록 조회 중 오류가 발생했습니다.",
      message: String(error),
    };
  }
};
