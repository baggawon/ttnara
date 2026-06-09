import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { parseQueryParams } from "@/helpers/common";
import type { AttendanceReadProps } from "@/app/api/attendance/read";
import { GET as attendanceReadGET } from "@/app/api/attendance/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: AttendanceReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await attendanceReadGET(queryParams);
  return response.json(result);
};
