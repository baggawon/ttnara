import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { GuaranteeDeleteProps } from "@/app/api/admin_di2u3k2j/guarantee/delete";
import { POST as guaranteeDeletePOST } from "@/app/api/admin_di2u3k2j/guarantee/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: GuaranteeDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await guaranteeDeletePOST(json);
  return response.json(result);
};
