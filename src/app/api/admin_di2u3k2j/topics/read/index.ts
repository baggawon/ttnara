import type { topic } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface TopicWithPoint extends topic {}

export interface TopicsListResponse {
  topics: TopicWithPoint[];
  pagination: PaginationInfo;
}

export interface TopicsReadProps {
  page: number;
  pageSize: number;
  order?: "asc" | "desc";
  search?: string;
  topic_id?: number;
}

async function getTopicsWithPagination(
  queryParams: any
): Promise<TopicsListResponse> {
  const manager = paginationManager(queryParams);

  if (typeof queryParams.topic_id === "number") {
    const topic = await handleConnect((prisma) =>
      prisma.topic.findFirst({
        where: {
          id: queryParams.topic_id,
        },
      })
    );
    if (!topic) throw ToastData.unknown;
    return {
      topics: [topic],
      pagination: manager.getPagination(),
    };
  }

  const { page, pageSize } = manager.getPageInfo();

  // 정렬 순서
  let id: Prisma.SortOrder = Prisma.SortOrder.desc;
  if (queryParams?.order === "asc") id = Prisma.SortOrder.asc;
  const where: any = {};

  if (queryParams.search) {
    if (!where.OR) {
      where.OR = [];
      where.OR.push({ name: { startsWith: queryParams.search } });
      where.OR.push({
        url: { startsWith: queryParams.search },
      });
    }
  }

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.topic.findMany({
        where,
      }),
      prisma.topic.findMany({
        where,
        orderBy: { id },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );
  if (!result) throw ToastData.unknown;
  const totalCount = result[0].length;
  const topics = result[1];
  if (!topics || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    topics,
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
