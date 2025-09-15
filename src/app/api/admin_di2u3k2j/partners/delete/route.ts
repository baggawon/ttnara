import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { PartnersDeleteProps } from "@/app/api/admin_di2u3k2j/partners/delete";
import { POST as partnersDeletePOST } from "@/app/api/admin_di2u3k2j/partners/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: PartnersDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await partnersDeletePOST(json);
  return response.json(result);
};
