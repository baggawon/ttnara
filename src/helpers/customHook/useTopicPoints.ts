"use client";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { userGet } from "@/helpers/get";
import { QueryKey, type UserAndSettings } from "@/helpers/types";
import type { TopicSettings } from "@/app/api/topic/read";

export interface TopicPointInfo {
  balance: number;
  cost: {
    write: number;
    read: number;
    comment: number;
    upvote: number;
    downvote: number;
  };
  canAfford: {
    write: boolean;
    read: boolean;
    comment: boolean;
    upvote: boolean;
    downvote: boolean;
  };
}

const positiveCost = (raw: number | null | undefined): number =>
  raw && raw < 0 ? Math.abs(raw) : 0;

const useTopicPoints = (
  topicSettings?: TopicSettings | null
): TopicPointInfo => {
  const { data: userData } = useGetQuery<
    UserAndSettings | null | undefined,
    undefined
  >(
    {
      queryKey: [QueryKey.account],
      retry: false,
      throwOnError: false,
    },
    userGet
  );

  const balance = userData?.profile?.point ?? 0;
  const cost = {
    write: positiveCost(topicSettings?.points_per_post_create),
    read: positiveCost(topicSettings?.points_per_post_read),
    comment: positiveCost(topicSettings?.points_per_comment_create),
    upvote: positiveCost(topicSettings?.points_per_upvote),
    downvote: positiveCost(topicSettings?.points_per_downvote),
  };

  return {
    balance,
    cost,
    canAfford: {
      write: balance >= cost.write,
      read: balance >= cost.read,
      comment: balance >= cost.comment,
      upvote: balance >= cost.upvote,
      downvote: balance >= cost.downvote,
    },
  };
};

export default useTopicPoints;
