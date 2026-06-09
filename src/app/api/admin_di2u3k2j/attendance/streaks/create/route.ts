import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { AttendanceStreakCreateProps } from "@/app/api/admin_di2u3k2j/attendance/streaks/create";
import { POST as streakCreate } from "@/app/api/admin_di2u3k2j/attendance/streaks/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: AttendanceStreakCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await streakCreate(json);
  return response.json(result);
};
