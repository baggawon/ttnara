import type { attendance_streak } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  paginationManager,
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import type { PaginationInfo } from "@/helpers/types";

export interface AttendanceStreaksReadProps {
  page?: number;
  pageSize?: number;
}

export interface AttendanceStreaksListResponse {
  streaks: attendance_streak[];
  pagination: PaginationInfo;
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const manager = paginationManager(queryParams);
    const { page, pageSize } = manager.getPageInfo();

    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.attendance_streak.count(),
        prisma.attendance_streak.findMany({
          orderBy: { day_count: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ])
    );
    if (!result) throw ToastData.unknown;

    const [totalCount, streaks] = result;
    manager.setTotalCount(totalCount);

    const data: AttendanceStreaksListResponse = {
      streaks,
      pagination: manager.getPagination(),
    };
    return { result: true, data };
  } catch (error) {
    return { result: false, message: String(error) };
  }
}
