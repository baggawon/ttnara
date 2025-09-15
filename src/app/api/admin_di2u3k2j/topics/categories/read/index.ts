import type { category } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface TopicCategoriesListResponse {
  categories: category[];
  pagination: PaginationInfo;
}

export interface TopicCategoriesReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  topic_id: number;
  category_id?: number;
}

async function getTopicsWithPagination(
  queryParams: any
): Promise<TopicCategoriesListResponse> {
  const manager = paginationManager(queryParams);

  if (typeof queryParams.category_id === "number") {
    const category = await handleConnect((prisma) =>
      prisma.category.findFirst({
        where: {
          topic_id: queryParams.topic_id,
          id: queryParams.category_id,
        },
      })
    );
    if (!category) throw ToastData.unknown;
    return {
      categories: [category],
      pagination: manager.getPagination(),
    };
  }

  // 정렬 순서
  let id: Prisma.SortOrder = Prisma.SortOrder.desc;
  if (queryParams?.order === "asc") id = Prisma.SortOrder.asc;
  const where: any = {
    topic_id: queryParams.topic_id,
  };

  if (queryParams.search) {
    if (!where.OR) {
      where.OR = [];
      where.OR.push({ name: { startsWith: queryParams.search } });
      where.OR.push({
        description: { startsWith: queryParams.search },
      });
    }
  }

  const { page, pageSize } = manager.getPageInfo();

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.category.findMany({
        where,
      }),
      prisma.category.findMany({
        where,
        orderBy: { id },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );
  if (!result) throw ToastData.unknown;
  const totalCount = result[0].length;
  const categories = result[1];
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

    const response = await getTopicsWithPagination(queryParams);
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
