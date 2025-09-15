import { type NextRequest, NextResponse } from "next/server";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface TetherKrwRate {
  prev_closing_price: string;
  trade_price: string;
}

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const data: TetherKrwRate = (await appCache.getByKey(CacheKey.Tether)) as any;
  return NextResponse.json({ result: true, data });
};
