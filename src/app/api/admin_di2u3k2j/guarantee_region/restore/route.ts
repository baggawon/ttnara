import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { GuaranteeRegionRestoreProps } from "@/app/api/admin_di2u3k2j/guarantee_region/restore";
import { POST as GuaranteeRegionRestorePOST } from "@/app/api/admin_di2u3k2j/guarantee_region/restore";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: GuaranteeRegionRestoreProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await GuaranteeRegionRestorePOST(json);
  return response.json(result);
};
