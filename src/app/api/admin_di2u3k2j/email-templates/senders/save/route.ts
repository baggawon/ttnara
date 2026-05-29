import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { EmailSendersSaveProps } from "@/app/api/admin_di2u3k2j/email-templates/senders/save";
import { POST as sendersSavePOST } from "@/app/api/admin_di2u3k2j/email-templates/senders/save";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: EmailSendersSaveProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await sendersSavePOST(json);
  return response.json(result);
};
