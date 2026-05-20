import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { TetherSettingsUpdateProps } from "@/app/api/admin_di2u3k2j/settings/tether/update";
import { POST as tetherSettingsUpdate } from "@/app/api/admin_di2u3k2j/settings/tether/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: TetherSettingsUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await tetherSettingsUpdate(json);
  return response.json(result);
};
