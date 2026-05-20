import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface PushHistoryWithUser {
  id: number;
  title: string;
  body: string;
  url: string | null;
  category: string;
  template_id: number | null;
  sent_by: string;
  recipient_count: number;
  target_type: string;
  sent_at: Date;
  user: {
    profile: {
      displayname: string;
    } | null;
  };
}

export interface PushHistoryListResponse {
  histories: PushHistoryWithUser[];
  pagination: PaginationInfo;
}

export interface PushHistoryReadProps {
  page?: number;
  pageSize?: number;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export const GET = async (queryParams: PushHistoryReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const manager = paginationManager(queryParams);
    const { page, pageSize } = manager.getPageInfo();

    const where: any = {};

    if (queryParams.search?.trim()) {
      where.OR = [
        { title: { contains: queryParams.search, mode: "insensitive" } },
        { body: { contains: queryParams.search, mode: "insensitive" } },
      ];
    }

    if (queryParams.from_date || queryParams.to_date) {
      where.sent_at = {};
      if (queryParams.from_date) {
        where.sent_at.gte = new Date(queryParams.from_date);
      }
      if (queryParams.to_date) {
        where.sent_at.lte = new Date(queryParams.to_date);
      }
    }

    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.push_history.count({ where }),
        prisma.push_history.findMany({
          where,
          orderBy: { sent_at: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: {
              select: {
                profile: {
                  select: {
                    displayname: true,
                  },
                },
              },
            },
          },
        }),
      ])
    );

    if (!result) throw ToastData.unknown;
    const [totalCount, histories] = result;
    if (!histories || typeof totalCount !== "number") throw ToastData.unknown;

    manager.setTotalCount(totalCount);

    return {
      result: true,
      isSuccess: true,
      data: {
        histories,
        pagination: manager.getPagination(),
      },
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: "발송 내역 조회 중 오류가 발생했습니다.",
      message: String(error),
    };
  }
};
