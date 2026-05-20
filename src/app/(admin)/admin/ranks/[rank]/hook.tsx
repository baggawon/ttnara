"use client";

import type { trade_rank } from "@prisma/client";
import type { RanksUpdateProps } from "@/app/api/admin_di2u3k2j/ranks/update";
import { useToast } from "@/components/ui/use-toast";
import { postFormData, postJson, refreshCache } from "@/helpers/common";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
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
import { useEffect, useState } from "react";
import type { RankBadgeUploadResult } from "@/app/api/admin_di2u3k2j/rank_badges/upload";

export const useAdminRanksEditHook = (rankId: number) => {
  const router = useRouter();

  // Fetch existing ranks
  const { data: ranksData } = useGetQuery<RanksListResponse, RanksReadProps>(
    {
      queryKey: [QueryKey.ranks],
    },
    adminRanksGet,
    { page: 1, pageSize: 100 } // Fetch all ranks for validation
  );

  const currentRank = ranksData?.ranks.find((rank) => rank.id === rankId);

  const methods = useForm<RanksUpdateProps>();

  // Set form default values when data is loaded
  useEffect(() => {
    if (currentRank) {
      methods.reset(currentRank);
    }
  }, [currentRank, methods]);

  const goBack = () => {
    router.push(AdminAppRoute.Ranks);
  };

  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const submit = async (props: trade_rank) => {
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
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminRanksUpdate,
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

  const [isUploadingBadge, setIsUploadingBadge] = useState(false);

  const unsetBadge = async () => {
    if (!currentRank) return;
    setLoading();
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminRankBadgesUnassign,
        { rank_id: currentRank.id }
      );
      toast({
        id: hasMessage ?? ToastData.rankBadgeUnassign,
        type: isSuccess ? "success" : "error",
      });
      if (isSuccess) refreshCache(queryClient, QueryKey.ranks);
    } finally {
      disableLoading();
    }
  };

  const uploadBadge = async (file: File) => {
    if (!currentRank) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("rangeStart", String(currentRank.rank_level));
    fd.append("rangeEnd", String(currentRank.rank_level));

    setIsUploadingBadge(true);
    setLoading();
    try {
      const { isSuccess, hasMessage, hasData } = await postFormData(
        ApiRoute.adminRankBadgesUpload,
        fd
      );
      if (!isSuccess) {
        toast({
          id: hasMessage ?? ToastData.rankBadgeUpload,
          type: "error",
        });
        return;
      }
      const payload = hasData as RankBadgeUploadResult | false;
      if (payload && payload.ok === false) {
        toast({
          id: ToastData.rankBadgeAssignConflict,
          type: "error",
          value: payload.description,
        });
        return;
      }
      toast({ id: ToastData.rankBadgeUpload, type: "success" });
      refreshCache(queryClient, QueryKey.ranks);
    } finally {
      setIsUploadingBadge(false);
      disableLoading();
    }
  };

  return {
    methods,
    goBack,
    submit,
    currentRank,
    uploadBadge,
    unsetBadge,
    isUploadingBadge,
  };
};
