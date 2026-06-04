"use client";

import type { board_rank } from "@prisma/client";
import type { BoardRanksUpdateProps } from "@/app/api/admin_di2u3k2j/board_ranks/update";
import { useToast } from "@/components/ui/use-toast";
import { postFormData, postJson, refreshCache } from "@/helpers/common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useForm } from "react-hook-form";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminBoardRanksGet } from "@/helpers/get";
import type {
  BoardRanksListResponse,
  BoardRanksReadProps,
} from "@/app/api/admin_di2u3k2j/board_ranks/read";
import { validateMinPoint } from "@/helpers/validate";
import { useEffect, useState } from "react";
import type { BoardRankBadgeUploadResult } from "@/app/api/admin_di2u3k2j/board_rank_badges/upload";

export const useAdminBoardRanksEditHook = (
  rankId: number | null,
  onSuccess?: () => void
) => {
  // Fetch existing ranks
  const { data: ranksData } = useGetQuery<
    BoardRanksListResponse,
    BoardRanksReadProps
  >(
    {
      queryKey: [QueryKey.boardRanks],
    },
    adminBoardRanksGet,
    { page: 1, pageSize: 100 }, // Fetch all ranks for validation
    { silent: true }
  );

  const currentRank = ranksData?.ranks.find((rank) => rank.id === rankId);

  const methods = useForm<BoardRanksUpdateProps>();

  // Set form default values when data is loaded / the edited rank changes.
  useEffect(() => {
    if (currentRank) {
      methods.reset(currentRank);
    }
  }, [currentRank, methods]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (props: board_rank) => {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminBoardRanksUpdate,
        props
      );
      if (hasMessage) {
        toast({
          id: hasMessage,
          type: isSuccess ? "success" : "error",
        });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.boardRanks);
        onSuccess?.();
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const submit = (props: board_rank) => {
    if (!validateMinPoint(props.min_point, props.rank_level, ranksData)) {
      toast({
        id: ToastData.rankMinTradeCount,
        type: "error",
      });
      return;
    }
    if (submitMutation.isPending) return;
    submitMutation.mutate(props);
  };

  const [isUploadingBadge, setIsUploadingBadge] = useState(false);

  const unsetBadge = async () => {
    if (!currentRank) return;
    const { isSuccess, hasMessage } = await postJson(
      ApiRoute.adminBoardRankBadgesUnassign,
      { rank_id: currentRank.id }
    );
    toast({
      id: hasMessage ?? ToastData.rankBadgeUnassign,
      type: isSuccess ? "success" : "error",
    });
    if (isSuccess) refreshCache(queryClient, QueryKey.boardRanks);
  };

  const uploadBadge = async (file: File) => {
    if (!currentRank) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("rangeStart", String(currentRank.rank_level));
    fd.append("rangeEnd", String(currentRank.rank_level));

    setIsUploadingBadge(true);
    try {
      const { isSuccess, hasMessage, hasData } = await postFormData(
        ApiRoute.adminBoardRankBadgesUpload,
        fd
      );
      if (!isSuccess) {
        toast({
          id: hasMessage ?? ToastData.rankBadgeUpload,
          type: "error",
        });
        return;
      }
      const payload = hasData as BoardRankBadgeUploadResult | false;
      if (payload && payload.ok === false) {
        toast({
          id: ToastData.rankBadgeAssignConflict,
          type: "error",
          value: payload.description,
        });
        return;
      }
      toast({ id: ToastData.rankBadgeUpload, type: "success" });
      refreshCache(queryClient, QueryKey.boardRanks);
    } finally {
      setIsUploadingBadge(false);
    }
  };

  return {
    methods,
    submit,
    currentRank,
    uploadBadge,
    unsetBadge,
    isUploadingBadge,
    isSubmitting: submitMutation.isPending,
  };
};
