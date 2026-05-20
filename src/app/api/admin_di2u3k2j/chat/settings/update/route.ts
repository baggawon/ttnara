import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as settingsUpdate } from "@/app/api/admin_di2u3k2j/chat/settings/update";
import type { ChatSettingsUpdateProps } from "@/app/api/admin_di2u3k2j/chat/settings/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatSettingsUpdateProps = await req.json();
  const result = await settingsUpdate(json);
  return response.json(result);
};
