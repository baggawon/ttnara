import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { EmailTemplateUpdateProps } from "@/app/api/admin_di2u3k2j/email-templates/update";
import { POST as updatePOST } from "@/app/api/admin_di2u3k2j/email-templates/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: EmailTemplateUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await updatePOST(json);
  return response.json(result);
};
