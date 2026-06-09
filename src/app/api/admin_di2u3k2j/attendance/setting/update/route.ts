import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { AttendanceSettingUpdateProps } from "@/app/api/admin_di2u3k2j/attendance/setting/update";
import { POST as settingUpdate } from "@/app/api/admin_di2u3k2j/attendance/setting/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: AttendanceSettingUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await settingUpdate(json);
  return response.json(result);
};
