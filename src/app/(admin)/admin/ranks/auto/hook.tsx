"use client";

import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { generatePoints } from "./utils";

type ProgressionType = "linear" | "convex" | "concave";

interface ChartDataPoint {
  x: number;
  y: number;
}

interface AutoCreateProps {
  maxRank: number;
  maxTradeCount: number;
  progressionType: ProgressionType;
  progressionRate: number;
}

interface SimulatedRank {
  rank_level: number;
  min_trade_count: number;
}

export const useAdminRanksAutoCreateHook = () => {
  const router = useRouter();
  const [simulatedRanks, setSimulatedRanks] = useState<SimulatedRank[]>([]);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const methods = useForm<AutoCreateProps>({
    defaultValues: {
      maxRank: 100,
      maxTradeCount: 100000,
      progressionType: "linear",
      progressionRate: 3,
    },
  });

  const goBack = () => {
    router.push(AdminAppRoute.Ranks);
  };

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const submit = async (props: AutoCreateProps) => {
    try {
      setLoading();

      // Calculate all ranks first
      const allRanks = [];
      for (let i = 1; i <= props.maxRank; i++) {
        const currentRankMaxTradeCount = Math.round(
          props.maxTradeCount * (i / props.maxRank)
        );
        allRanks.push({
          rank_level: i,
          min_trade_count: currentRankMaxTradeCount,
        });
      }

      // Send all ranks in a single batch operation
      await postJson(ApiRoute.adminRanksBatchCreate, {
        ranks: allRanks,
      });

      toast({
        id: ToastData.rankBatchCreate,
        type: "success",
      });

      refreshCache(queryClient, QueryKey.ranks);
      goBack();
    } catch (error) {
      console.error("Error during rank creation:", error);
      toast({
        id: ToastData.rankBatchCreate,
        type: "error",
      });
    } finally {
      disableLoading();
    }
  };

  const calculatePreviewRanks = (
    maxRank: number,
    maxTradeCount: number,
    progressionType: ProgressionType,
    progressionRate: number
  ): SimulatedRank[] => {
    const allRanks: SimulatedRank[] = [];
    const minTradeCount = Math.max(1, Math.floor(maxTradeCount * 0.01)); // Ensure at least 1% of max for first rank

    for (let i = 1; i <= maxRank; i++) {
      let progress = i / maxRank;

      // Apply progression type and rate
      if (progressionType === "convex") {
        // For convex (exponential)
        progress = Math.pow(progress, progressionRate);
      } else if (progressionType === "concave") {
        // For concave (logarithmic)
        progress = Math.pow(progress, 1 / progressionRate);
      }
      // linear keeps progress as is

      // Calculate trade count with minimum threshold
      const calculatedTradeCount = Math.round(maxTradeCount * progress);
      const currentRankMaxTradeCount = Math.max(
        minTradeCount * i, // Linear minimum increase
        calculatedTradeCount
      );

      allRanks.push({
        rank_level: i,
        min_trade_count: currentRankMaxTradeCount,
      });
    }

    // Normalize the last rank to exactly maxTradeCount
    if (allRanks.length > 0) {
      allRanks[allRanks.length - 1].min_trade_count = maxTradeCount;
    }

    // If maxRank <= 9, return all ranks
    if (maxRank <= 9) return allRanks;

    // Otherwise, return first 3, middle 3, and last 3
    const middle = Math.floor(maxRank / 2);
    return [
      ...allRanks.slice(0, 3),
      ...allRanks.slice(middle - 1, middle + 2),
      ...allRanks.slice(-3),
    ];
  };

  const simulate = (props: AutoCreateProps) => {
    const previewRanks = calculatePreviewRanks(
      props.maxRank,
      props.maxTradeCount,
      props.progressionType,
      props.progressionRate
    );

    const points = generatePoints(
      props.maxRank,
      props.maxTradeCount,
      props.progressionType,
      props.progressionRate,
      100
    );

    setChartData(points);
    setSimulatedRanks(previewRanks);
    setHasSimulated(true);
  };

  return {
    methods,
    goBack,
    simulate,
    submit,
    simulatedRanks,
    hasSimulated,
    chartData,
  };
};
