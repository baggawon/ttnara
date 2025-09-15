import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { updateUserRank } from "@/helpers/server/rankEvaluator";
import { ToastData } from "@/helpers/toastData";

export interface EvaluateRankProps {
  uid: string;
}

export const POST = async (json: EvaluateRankProps) => {
  const response = ResponseValues<ApiReturnProps>();

  try {
    const { uid } = await requestValidator([RequestValidator.User], json);
    if (!uid) throw ToastData.unknown;

    // Handle all Prisma operations within a single connection
    await handleConnect(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id: uid },
        select: { id: true, trade_count: true },
      });

      if (!user) throw ToastData.unknown;

      await updateUserRank(prisma, uid, user.trade_count);
    });

    return {
      result: true,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
