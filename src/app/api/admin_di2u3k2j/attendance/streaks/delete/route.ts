import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { AttendanceStreakDeleteProps } from "@/app/api/admin_di2u3k2j/attendance/streaks/delete";
import { POST as streakDelete } from "@/app/api/admin_di2u3k2j/attendance/streaks/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: AttendanceStreakDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await streakDelete(json);
  return response.json(result);
};
