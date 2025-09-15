import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { TetherCategoryUpdateProps } from "@/app/api/admin_di2u3k2j/tether_category/update";
import { POST as TetherCategoryUpdatePOST } from "@/app/api/admin_di2u3k2j/tether_category/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: TetherCategoryUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await TetherCategoryUpdatePOST(json);
  return response.json(result);
};
