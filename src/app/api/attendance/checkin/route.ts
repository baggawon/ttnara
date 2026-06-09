import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { AttendanceCheckinProps } from "@/app/api/attendance/checkin";
import { POST as attendanceCheckinPOST } from "@/app/api/attendance/checkin";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: AttendanceCheckinProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await attendanceCheckinPOST(json);
  return response.json(result);
};
