import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { GuaranteeRegionUpdateProps } from "@/app/api/admin_di2u3k2j/guarantee_region/update";
import { POST as GuaranteeRegionUpdatePOST } from "@/app/api/admin_di2u3k2j/guarantee_region/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: GuaranteeRegionUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await GuaranteeRegionUpdatePOST(json);
  return response.json(result);
};
