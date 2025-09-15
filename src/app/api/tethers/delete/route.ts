import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { tethersDeleteProps } from "@/app/api/tethers/delete";
import { POST as tethersDeletePOST } from "@/app/api/tethers/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: tethersDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await tethersDeletePOST(json);
  return response.json(result);
};
