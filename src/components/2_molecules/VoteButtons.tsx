"use client";

import { Button } from "@/components/ui/button";
import { postJson, refreshCache } from "@/helpers/common";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import type { ThreadVoteProps } from "@/app/api/threads/vote";
import { useState } from "react";

interface VoteButtonsProps {
  thread_id: number;
  topic_url: string;
  upvotes: number;
  downvotes: number;
  showUpvote: boolean;
  showDownvote: boolean;
  userVote: "up" | "down" | null;
  upvoteCost?: number;
  downvoteCost?: number;
  canAffordUpvote?: boolean;
  canAffordDownvote?: boolean;
}

export const VoteButtons = ({
  thread_id,
  topic_url,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  showUpvote,
  showDownvote,
  userVote: initialUserVote,
  upvoteCost = 0,
  downvoteCost = 0,
  canAffordUpvote = true,
  canAffordDownvote = true,
}: VoteButtonsProps) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(initialUserVote);

  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const handleVote = async (vote_type: "up" | "down") => {
    setLoading();
    try {
      const { isSuccess, hasMessage, hasData } =
        await postJson<ThreadVoteProps>(ApiRoute.threadVote, {
          thread_id,
          topic_url,
          vote_type,
        });

      if (hasMessage && !isSuccess) {
        toast({ id: hasMessage, type: "error" });
      }

      if (isSuccess && hasData) {
        setUpvotes(hasData.upvotes);
        setDownvotes(hasData.downvotes);
        setUserVote(hasData.user_vote);
        refreshCache(queryClient, QueryKey.thread);
      }
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    disableLoading();
  };

  if (!showUpvote && !showDownvote) return null;

  const upvoteBlocked = upvoteCost > 0 && !canAffordUpvote;
  const downvoteBlocked = downvoteCost > 0 && !canAffordDownvote;
  const upvoteTitle = upvoteBlocked
    ? `포인트가 부족합니다 (필요: ${upvoteCost.toLocaleString()}P)`
    : upvoteCost > 0
      ? `${upvoteCost.toLocaleString()}P 차감`
      : undefined;
  const downvoteTitle = downvoteBlocked
    ? `포인트가 부족합니다 (필요: ${downvoteCost.toLocaleString()}P)`
    : downvoteCost > 0
      ? `${downvoteCost.toLocaleString()}P 차감`
      : undefined;

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {showUpvote && (
        <Button
          type="button"
          variant={userVote === "up" ? "default" : "outline"}
          disabled={upvoteBlocked}
          title={upvoteTitle}
          className={`flex items-center gap-2 px-6 py-2 transition-all ${
            userVote === "up"
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300"
          }`}
          onClick={() => handleVote("up")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 10v12" />
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
          </svg>
          <span className="font-semibold">{upvotes}</span>
        </Button>
      )}
      {showDownvote && (
        <Button
          type="button"
          variant={userVote === "down" ? "default" : "outline"}
          disabled={downvoteBlocked}
          title={downvoteTitle}
          className={`flex items-center gap-2 px-6 py-2 transition-all ${
            userVote === "down"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300"
          }`}
          onClick={() => handleVote("down")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 14V2" />
            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
          </svg>
          <span className="font-semibold">{downvotes}</span>
        </Button>
      )}
    </div>
  );
};
