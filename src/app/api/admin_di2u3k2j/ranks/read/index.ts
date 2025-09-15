import type { trade_rank } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface RanksListResponse {
  ranks: trade_rank[];
  pagination: PaginationInfo;
}

export interface RanksReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  searchField?: "rank_level" | "description";
  rank_id?: number;
}

async function getRanksWithPagination(
  queryParams: any
): Promise<RanksListResponse> {
  const manager = paginationManager(queryParams);

  if (typeof queryParams.rank_id === "number") {
    const rank = await handleConnect((prisma) =>
      prisma.trade_rank.findFirst({
        where: {
          id: queryParams.rank_id,
        },
      })
    );
    if (!rank) throw ToastData.unknown;
    return {
      ranks: [rank],
      pagination: manager.getPagination(),
    };
  }

  const { page, pageSize } = manager.getPageInfo();

  // 정렬 순서
  let orderBy: any = { rank_level: Prisma.SortOrder.desc }; // Default to ascending rank_level
  if (queryParams?.order === "asc") {
    orderBy = { rank_level: Prisma.SortOrder.asc };
  }

  const where: any = {};

  if (queryParams.search) {
    const searchValue = queryParams.search.trim();

    switch (queryParams.searchField) {
      case "description":
        where.description = {
          contains: searchValue,
          mode: "insensitive", // make search case-insensitive
        };
        break;

      case "name":
      default:
        where.name = {
          contains: searchValue,
          mode: "insensitive", // make search case-insensitive
        };
        break;
    }
  }

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.trade_rank.findMany({
        where,
      }),
      prisma.trade_rank.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );

  if (!result) throw ToastData.unknown;
  const totalCount = result[0].length;
  const ranks = result[1];
  if (!ranks || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    ranks,
    pagination: manager.getPagination(),
  };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getRanksWithPagination(queryParams);
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
