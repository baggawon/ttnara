import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { KycUpdateProps } from "@/app/api/kyc/update";
import { POST as KycUpdatePOST } from "@/app/api/kyc/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: KycUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await KycUpdatePOST(json);
  return response.json(result);
};
