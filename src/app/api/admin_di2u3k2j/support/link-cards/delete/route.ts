import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as linkCardsDelete } from "@/app/api/admin_di2u3k2j/support/link-cards/delete";
import type { SupportLinkCardsDeleteProps } from "@/app/api/admin_di2u3k2j/support/link-cards/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SupportLinkCardsDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await linkCardsDelete(json);
  return response.json(result);
};
