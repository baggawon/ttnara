import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ThreadVoteResponse } from "@/app/api/threads/vote";
import type { NextRequest, NextResponse } from "next/server";
import { POST as threadVotePOST } from "@/app/api/threads/vote";
import type { ThreadVoteProps } from "@/app/api/threads/vote";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: ThreadVoteProps = await req.json();
  const response = ResponseValues<ThreadVoteResponse>();

  const result = await threadVotePOST(json);
  return response.json(result);
};
