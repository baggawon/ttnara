import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { EmailTemplatePreviewProps } from "@/app/api/admin_di2u3k2j/email-templates/preview";
import { POST as previewPOST } from "@/app/api/admin_di2u3k2j/email-templates/preview";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: EmailTemplatePreviewProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await previewPOST(json);
  return response.json(result);
};
