import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { GuaranteeRegionDeleteProps } from "@/app/api/admin_di2u3k2j/guarantee_region/delete";
import { POST as GuaranteeRegionDeletePOST } from "@/app/api/admin_di2u3k2j/guarantee_region/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: GuaranteeRegionDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await GuaranteeRegionDeletePOST(json);
  return response.json(result);
};
