import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { dispatchPendingNotifications } from "@/helpers/server/notificationQueue";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();

  // Simple auth: check for a shared secret
  const authHeader = req.headers.get("x-cron-secret");
  if (authHeader !== process.env.CRON_SECRET) {
    return response.json({ result: false, message: "Unauthorized" });
  }

  const result = await dispatchPendingNotifications();
  return response.json({ result: true, data: result });
};
