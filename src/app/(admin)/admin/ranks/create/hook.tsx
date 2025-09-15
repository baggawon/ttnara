"use client";

import type { trade_rank } from "@prisma/client";
import type { RankCreateProps } from "@/app/api/admin_di2u3k2j/ranks/create";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { tradeRankCreateDefault } from "@/helpers/defaultValue";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminRanksGet } from "@/helpers/get";
import type {
  RanksListResponse,
  RanksReadProps,
} from "@/app/api/admin_di2u3k2j/ranks/read";
import { validateMinTradeCount } from "@/helpers/validate";

export const useAdminRanksCreateHook = () => {
  const router = useRouter();

  // Fetch existing ranks
  const { data: ranksData } = useGetQuery<RanksListResponse, RanksReadProps>(
    {
      queryKey: [QueryKey.ranks],
    },
    adminRanksGet,
    { page: 1, pageSize: 100 } // Fetch all ranks for validation
  );

  const methods = useForm<RankCreateProps>({
    defaultValues: tradeRankCreateDefault(),
    reValidateMode: "onSubmit",
  });

  const goBack = () => {
    router.push(AdminAppRoute.Ranks);
  };

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const submit = async (props: trade_rank) => {
    // Validate one final time before submitting
    if (
      !validateMinTradeCount(props.min_trade_count, props.rank_level, ranksData)
    ) {
      toast({
        id: ToastData.rankMinTradeCount,
        type: "error",
      });
      return;
    }

    setLoading();
    try {
      const { isSuccess, hasMessage } = await postJson<RankCreateProps>(
        ApiRoute.adminRanksCreate,
        props
      );
      if (hasMessage) {
        toast({
          id: hasMessage,
          type: isSuccess ? "success" : "error",
        });
      }
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.ranks);
        goBack();
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  return {
    methods,
    goBack,
    submit,
  };
};
