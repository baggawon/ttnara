import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as mediaUploadHandler } from "@/app/api/uploads/media";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const formData: FormData = await req.formData();
  const response = ResponseValues<ApiReturnProps>();
  const result = await mediaUploadHandler(formData);
  return response.json(result);
};
