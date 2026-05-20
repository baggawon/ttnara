import { ResponseValues } from "@/helpers/server/serverResponse";
import { handleConnect } from "@/helpers/server/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { ToastData } from "@/helpers/toastData";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";

export interface ChatReportProps {
  message_id: string;
  reason?: string;
}

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    return response.json({ result: false, message: ToastData.noAuth });
  }

  const json = (await req.json()) as ChatReportProps;
  if (!json.message_id) {
    return response.json({ result: false, message: ToastData.unknown });
  }

  const user = await handleConnect((prisma) =>
    prisma.user.findUnique({
      where: { username: session.user!.name! },
      select: { id: true },
    })
  );
  if (!user) {
    return response.json({ result: false, message: ToastData.noAuth });
  }

  await handleConnect((prisma) =>
    prisma.chat_report.create({
      data: {
        reporter_id: user.id,
        message_id: json.message_id,
        reason: json.reason?.slice(0, 200) ?? null,
      },
    })
  );

  return response.json({
    result: true,
    message: "신고가 접수되었습니다.",
  });
};
