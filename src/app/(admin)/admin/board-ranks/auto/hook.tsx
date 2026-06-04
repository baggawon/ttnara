"use client";

import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  maxPoint: number;
  progressionType: ProgressionType;
  progressionRate: number;
}

interface SimulatedRank {
  rank_level: number;
  min_point: number;
}

export const useAdminBoardRanksAutoCreateHook = () => {
  const router = useRouter();
  const [simulatedRanks, setSimulatedRanks] = useState<SimulatedRank[]>([]);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const methods = useForm<AutoCreateProps>({
    defaultValues: {
      maxRank: 100,
      maxPoint: 100000,
      progressionType: "linear",
      progressionRate: 3,
    },
  });

  const goBack = () => {
    router.push(AdminAppRoute.BoardRanks);
  };

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (props: AutoCreateProps) => {
      // Calculate all ranks first
      const allRanks = [];
      for (let i = 1; i <= props.maxRank; i++) {
        let minPoint = 0;
        if (i > 1 && props.maxRank > 1) {
          let progress = (i - 1) / (props.maxRank - 1);
          if (props.progressionType === "convex") {
            progress = Math.pow(progress, props.progressionRate);
          } else if (props.progressionType === "concave") {
            progress = 1 - Math.pow(1 - progress, props.progressionRate);
          }
          minPoint = Math.round(props.maxPoint * progress);
        }
        allRanks.push({
          rank_level: i,
          min_point: minPoint,
        });
      }

      // Send all ranks in a single batch operation. postJson resolves (does not
      // throw) on a server { result: false }, so branch on isSuccess explicitly —
      // otherwise a swallowed server failure is reported to the admin as success.
      const { isSuccess } = await postJson(
        ApiRoute.adminBoardRanksBatchCreate,
        {
          ranks: allRanks,
        }
      );

      if (!isSuccess) {
        toast({ id: ToastData.rankBatchCreate, type: "error" });
        return;
      }

      toast({
        id: ToastData.rankBatchCreate,
        type: "success",
      });

      refreshCache(queryClient, QueryKey.boardRanks);
      goBack();
    },
    onError: (error) => {
      console.error("Error during rank creation:", error);
      toast({
        id: ToastData.rankBatchCreate,
        type: "error",
      });
    },
  });

  const submit = (props: AutoCreateProps) => {
    if (submitMutation.isPending) return;
    submitMutation.mutate(props);
  };

  const calculatePreviewRanks = (
    maxRank: number,
    maxPoint: number,
    progressionType: ProgressionType,
    progressionRate: number
  ): SimulatedRank[] => {
    const allRanks: SimulatedRank[] = [];

    for (let i = 1; i <= maxRank; i++) {
      let minPointValue = 0;
      if (i > 1 && maxRank > 1) {
        let progress = (i - 1) / (maxRank - 1);

        if (progressionType === "convex") {
          progress = Math.pow(progress, progressionRate);
        } else if (progressionType === "concave") {
          progress = 1 - Math.pow(1 - progress, progressionRate);
        }

        minPointValue = Math.round(maxPoint * progress);
      }

      allRanks.push({
        rank_level: i,
        min_point: minPointValue,
      });
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
      props.maxPoint,
      props.progressionType,
      props.progressionRate
    );

    const points = generatePoints(
      props.maxRank,
      props.maxPoint,
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
