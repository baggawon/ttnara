import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { AttendanceStreakUpdateProps } from "@/app/api/admin_di2u3k2j/attendance/streaks/update";
import { POST as streakUpdate } from "@/app/api/admin_di2u3k2j/attendance/streaks/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: AttendanceStreakUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await streakUpdate(json);
  return response.json(result);
};
