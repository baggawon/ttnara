import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { SettingsUpdateProps } from "@/app/api/settings/update";
import { POST as settingsUpdatePOST } from "@/app/api/settings/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SettingsUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await settingsUpdatePOST(json);
  return response.json(result);
};
