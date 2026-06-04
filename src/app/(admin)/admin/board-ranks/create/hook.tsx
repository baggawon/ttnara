"use client";

import type { board_rank } from "@prisma/client";
import type { BoardRankCreateProps } from "@/app/api/admin_di2u3k2j/board_ranks/create";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardRankCreateDefault } from "@/helpers/defaultValue";
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

export const useAdminBoardRanksCreateHook = (onSuccess?: () => void) => {
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

  const methods = useForm<BoardRankCreateProps>({
    defaultValues: boardRankCreateDefault(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (props: board_rank) => {
      const { isSuccess, hasMessage } = await postJson<BoardRankCreateProps>(
        ApiRoute.adminBoardRanksCreate,
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
        methods.reset(boardRankCreateDefault());
        onSuccess?.();
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const submit = (props: board_rank) => {
    // Validate one final time before submitting
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

  return {
    methods,
    submit,
    isSubmitting: submitMutation.isPending,
  };
};
