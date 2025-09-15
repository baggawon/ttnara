import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { TetherCategoryDeleteProps } from "@/app/api/admin_di2u3k2j/tether_category/delete";
import { POST as tetherCategoryDeletePOST } from "@/app/api/admin_di2u3k2j/tether_category/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: TetherCategoryDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await tetherCategoryDeletePOST(json);
  return response.json(result);
};
