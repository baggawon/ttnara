import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { applyTopicPoints, getBalance } from "@/helpers/server/pointService";
import { PointAction } from "@/helpers/pointSystem";
import { recordActivity } from "@/helpers/server/boardActivity";
import { BoardActivityAction } from "@/helpers/boardActivity";

export interface ThreadVoteProps {
  thread_id: number;
  topic_url: string;
  vote_type: "up" | "down";
}

export interface ThreadVoteResponse {
  result: boolean;
  message?: string;
  data?: {
    upvotes: number;
    downvotes: number;
    user_vote: "up" | "down" | null;
  };
}

export const POST = async (
  json: ThreadVoteProps
): Promise<ThreadVoteResponse> => {
  try {
    if (
      typeof json?.thread_id !== "number" ||
      typeof json?.topic_url !== "string" ||
      !["up", "down"].includes(json?.vote_type)
    )
      throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);
    const user_id = uid!;

    const topics = appCache.getByKey(CacheKey.Topics) as any;
    const topicSettings = topics[json.topic_url];

    if (!topicSettings) {
      return { result: false, message: "토픽을 찾을 수 없습니다." };
    }

    // 투표 유형에 따른 설정 확인
    if (json.vote_type === "up" && !topicSettings.use_upvote) {
      return { result: false, message: "추천 기능이 비활성화되어 있습니다." };
    }
    if (json.vote_type === "down" && !topicSettings.use_downvote) {
      return { result: false, message: "비추천 기능이 비활성화되어 있습니다." };
    }

    // 스레드 존재 확인
    const thread = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: { id: json.thread_id, topic_id: topicSettings.id },
        select: { id: true, author_id: true, upvotes: true, downvotes: true },
      })
    );

    if (!thread) {
      return { result: false, message: "게시글을 찾을 수 없습니다." };
    }

    // 자신의 글에 투표 방지
    if (thread.author_id === user_id) {
      return { result: false, message: "자신의 글에는 투표할 수 없습니다." };
    }

    // 기존 투표 확인
    const existingVote = await handleConnect((prisma) =>
      prisma.thread_vote.findUnique({
        where: { user_id_thread_id: { user_id, thread_id: json.thread_id } },
      })
    );

    let newUpvotes = thread.upvotes;
    let newDownvotes = thread.downvotes;
    let userVote: "up" | "down" | null = null;

    if (existingVote) {
      if (existingVote.vote_type === json.vote_type) {
        // 같은 투표 -> 취소
        await handleConnect((prisma) =>
          prisma.thread_vote.delete({
            where: { id: existingVote.id },
          })
        );
        if (json.vote_type === "up") newUpvotes--;
        else newDownvotes--;
        userVote = null;

        await recordActivity({
          uid: user_id,
          action:
            json.vote_type === "up"
              ? BoardActivityAction.upvote_cancel
              : BoardActivityAction.downvote_cancel,
          topic_id: topicSettings.id,
          thread_id: json.thread_id,
        });
      } else {
        // 다른 투표 -> 전환
        await handleConnect((prisma) =>
          prisma.thread_vote.update({
            where: { id: existingVote.id },
            data: { vote_type: json.vote_type },
          })
        );
        if (json.vote_type === "up") {
          newUpvotes++;
          newDownvotes--;
        } else {
          newDownvotes++;
          newUpvotes--;
        }
        userVote = json.vote_type;

        await recordActivity({
          uid: user_id,
          action: BoardActivityAction.vote_switch,
          topic_id: topicSettings.id,
          thread_id: json.thread_id,
          note: json.vote_type === "up" ? "down→up" : "up→down",
        });
      }
    } else {
      // 새 투표: gate negative-cost votes before inserting.
      const voteAmount =
        json.vote_type === "up"
          ? (topicSettings.points_per_upvote ?? 0)
          : (topicSettings.points_per_downvote ?? 0);

      if (voteAmount < 0) {
        const balance = await getBalance(user_id);
        if (balance < Math.abs(voteAmount)) {
          return { result: false, message: "포인트가 부족합니다." };
        }
      }

      const createdVote = await handleConnect((prisma) =>
        prisma.thread_vote.create({
          data: {
            user_id,
            thread_id: json.thread_id,
            vote_type: json.vote_type,
          },
        })
      );

      if (voteAmount !== 0 && createdVote) {
        const apply = await handleConnect((prisma) =>
          prisma.$transaction((tx) =>
            applyTopicPoints(tx, {
              uid: user_id,
              amount: voteAmount,
              action:
                json.vote_type === "up"
                  ? PointAction.upvote
                  : PointAction.downvote,
              topic_id: topicSettings.id,
              thread_id: json.thread_id,
            })
          )
        );
        if (!apply?.ok) {
          const createdVoteId = createdVote.id;
          await handleConnect((prisma) =>
            prisma.thread_vote.delete({ where: { id: createdVoteId } })
          );
          return { result: false, message: "포인트가 부족합니다." };
        }
      }

      if (json.vote_type === "up") newUpvotes++;
      else newDownvotes++;
      userVote = json.vote_type;

      await recordActivity({
        uid: user_id,
        action:
          json.vote_type === "up"
            ? BoardActivityAction.upvote
            : BoardActivityAction.downvote,
        topic_id: topicSettings.id,
        thread_id: json.thread_id,
      });
    }

    // 카운트 업데이트
    await handleConnect((prisma) =>
      prisma.thread.update({
        where: { id: json.thread_id },
        data: { upvotes: newUpvotes, downvotes: newDownvotes },
      })
    );

    return {
      result: true,
      data: {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        user_vote: userVote,
      },
    };
  } catch (error) {
    console.log("vote error", error);
    return { result: false, message: String(error) };
  }
};
