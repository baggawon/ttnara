import type { push_template } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface PushTemplateListResponse {
  templates: push_template[];
  pagination?: PaginationInfo;
}

export interface PushTemplateReadProps {
  page?: number;
  pageSize?: number;
  search?: string;
  mode?: "all";
}

export const GET = async (queryParams: PushTemplateReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    if (queryParams.mode === "all") {
      const templates = await handleConnect((prisma) =>
        prisma.push_template.findMany({
          orderBy: { created_at: "desc" },
        })
      );
      return {
        result: true,
        isSuccess: true,
        data: { templates: templates ?? [] },
      };
    }

    const manager = paginationManager(queryParams);
    const { page, pageSize } = manager.getPageInfo();

    const where: any = {};
    if (queryParams.search?.trim()) {
      where.OR = [
        { name: { contains: queryParams.search, mode: "insensitive" } },
        { title: { contains: queryParams.search, mode: "insensitive" } },
      ];
    }

    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.push_template.count({ where }),
        prisma.push_template.findMany({
          where,
          orderBy: { created_at: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
    );

    if (!result) throw ToastData.unknown;
    const [totalCount, templates] = result;
    if (!templates || typeof totalCount !== "number") throw ToastData.unknown;

    manager.setTotalCount(totalCount);

    return {
      result: true,
      isSuccess: true,
      data: {
        templates,
        pagination: manager.getPagination(),
      },
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: "템플릿 목록 조회 중 오류가 발생했습니다.",
      message: String(error),
    };
  }
};
