import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { TetherCategoryRestoreProps } from "@/app/api/admin_di2u3k2j/tether_category/restore";
import { POST as tetherCategoryRestorePOST } from "@/app/api/admin_di2u3k2j/tether_category/restore";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: TetherCategoryRestoreProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await tetherCategoryRestorePOST(json);
  return response.json(result);
};
