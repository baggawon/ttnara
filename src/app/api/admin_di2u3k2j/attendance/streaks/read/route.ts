import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { parseQueryParams } from "@/helpers/common";
import type { AttendanceStreaksReadProps } from "@/app/api/admin_di2u3k2j/attendance/streaks/read";
import { GET as streaksRead } from "@/app/api/admin_di2u3k2j/attendance/streaks/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: AttendanceStreaksReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await streaksRead(queryParams);
  return response.json(result);
};
