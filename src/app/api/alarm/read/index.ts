import {
  paginationManager,
  requestValidator,
  RequestValidator,
} from "@/helpers/server/serverFunctions";
import { type alarm, Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { SearchType, type PaginationInfo } from "@/helpers/types";
import { now } from "@/helpers/basic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";

export interface AlarmListResponse {
  alarms: alarm[];
  pagination: PaginationInfo;
}

export interface AlarmReadProps {
  page: number;
  pageSize: number;
  search?: string;
  column?: string;
  isRead?: boolean;
  isPreview?: boolean;
}

async function getAlarmsWithPagination(
  queryParams: any
): Promise<AlarmListResponse> {
  const json = queryParams as any as AlarmReadProps;

  const manager = paginationManager(json);

  const { uid } = await requestValidator([RequestValidator.User], queryParams);

  const where: Prisma.alarmWhereInput = {
    user_id: uid!,
    ...(typeof json.isRead === "boolean" && {
      is_read: json.isRead,
    }),
  };

  if (json.isPreview) {
    const previewDate = now().subtract(7, "days").toDate();
    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.alarm.count({
          where: {
            ...where,
            created_at: {
              lt: previewDate,
            },
          },
        }),

        prisma.alarm.findMany({
          where: {
            ...where,
            created_at: {
              gte: previewDate,
            },
          },
          orderBy: {
            created_at: Prisma.SortOrder.desc,
          },
        }),
      ])
    );
    if (!result) throw ToastData.unknown;
    const totalCount = result[0];
    const alarms = result[1];

    if (!alarms || typeof totalCount !== "number") throw ToastData.unknown;

    manager.setTotalCount(totalCount);

    return {
      alarms,
      pagination: manager.getPagination(),
    };
  }

  if (json.search) {
    switch (json.column) {
      case SearchType.제목:
        where.OR = [{ title: { contains: json.search } }];
        break;
      case SearchType.내용:
        where.OR = [{ body: { contains: json.search } }];
        break;
      case SearchType.제목_내용:
        where.OR = [
          { title: { contains: json.search } },
          { body: { contains: json.search } },
        ];
        break;
    }
  }

  const { page, pageSize } = manager.getPageInfo();

  const result = await handleConnect((prisma) =>
    Promise.all([
      prisma.alarm.count({ where }),

      prisma.alarm.findMany({
        where,
        orderBy: {
          created_at: Prisma.SortOrder.desc,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
  );
  if (!result) throw ToastData.unknown;
  const totalCount = result[0];
  const alarms = result[1];

  if (!alarms || typeof totalCount !== "number") throw ToastData.unknown;

  manager.setTotalCount(totalCount);

  return {
    alarms,
    pagination: manager.getPagination(),
  };
}

export const GET = async (queryParams: AlarmReadProps) => {
  try {
    const response = await getAlarmsWithPagination(queryParams);
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
};
