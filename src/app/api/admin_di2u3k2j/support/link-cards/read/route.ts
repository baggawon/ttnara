import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as linkCardsRead } from "@/app/api/admin_di2u3k2j/support/link-cards/read";
import { parseQueryParams } from "@/helpers/common";
import type { SupportLinkCardsReadProps } from "@/app/api/admin_di2u3k2j/support/link-cards/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: SupportLinkCardsReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await linkCardsRead(queryParams);
  return response.json(result);
};
