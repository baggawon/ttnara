"use client";

import { useState } from "react";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { AppRoute, QueryKey } from "@/helpers/types";
import { leaderboardGet } from "@/helpers/get";
import { DisplayRank } from "@/components/1_atoms/DisplayRank";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTimeDifference } from "@/helpers/basic";
import type { LeaderboardEntry } from "@/helpers/server/leaderboardService";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const periods = [
  { value: "total", label: "전체" },
  { value: "weekly", label: "주간" },
  { value: "daily", label: "일간" },
] as const;

const DISPLAY_COUNT = 6;

const PositionChange = ({
  position,
  prev_position,
}: {
  position: number;
  prev_position: number | null;
}) => {
  if (prev_position === null) {
    return (
      <span className="text-[11px] font-medium text-success px-1">New</span>
    );
  }

  const diff = prev_position - position;
  if (diff === 0)
    return <span className="text-[11px] text-muted-foreground px-1">-</span>;

  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-medium text-fail">
        <ArrowUp className="w-3 h-3" />
        {diff}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-0.5 text-[11px] font-medium text-blue-500">
      <ArrowDown className="w-3 h-3" />
      {Math.abs(diff)}
    </span>
  );
};

const RankingList = ({
  period,
  onRefresh,
}: {
  period: string;
  onRefresh: () => void;
}) => {
  const { data } = useGetQuery<any, { period: string }>(
    {
      queryKey: [{ [QueryKey.leaderboard]: { period } }],
    },
    leaderboardGet,
    { period },
    { silent: true }
  );

  const entries: LeaderboardEntry[] = data?.entries ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* List */}
      <div className="flex flex-col divide-y flex-1">
        {Array.from({ length: DISPLAY_COUNT }).map((_, i) => {
          const entry = entries[i];

          if (!entry) {
            return (
              <div
                key={`empty-${i}`}
                className="flex-1 flex items-center justify-between gap-2 px-1"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-6 text-center text-sm text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg border border-dashed border-gray-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground leading-snug">
                      --
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      --
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground px-1">
                  --
                </span>
              </div>
            );
          }

          return (
            <div
              key={entry.uid}
              className="flex-1 flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors px-1 rounded"
            >
              {/* Left: position + info */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Position number */}
                <span
                  className={clsx(
                    "w-6 text-center text-sm font-bold shrink-0",
                    entry.position === 1 && "text-yellow-500",
                    entry.position === 2 && "text-gray-400",
                    entry.position === 3 && "text-amber-600",
                    entry.position > 3 && "text-muted-foreground font-normal"
                  )}
                >
                  {entry.position}
                </span>

                {/* Rank badge */}
                <div className="shrink-0">
                  <DisplayRank
                    rank_level={entry.rank_level}
                    rank_image={entry.rank_image ?? "bronze.png"}
                    rank_name={`Lv.${entry.rank_level}`}
                    className="!w-7 !h-7"
                  />
                </div>

                {/* Name + time */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate leading-snug">
                    {entry.displayname}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {getTimeDifference(
                      true,
                      new Date(entry.updated_at).getTime()
                    )}
                  </p>
                </div>
              </div>

              {/* Right: score + position change */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <PositionChange
                  position={entry.position}
                  prev_position={entry.prev_position}
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {entry.ranking_point.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2">
        <Link href={AppRoute.Leaderboard} className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 text-sm"
          >
            더보기 ▼
          </Button>
        </Link>
      </div>
    </div>
  );
};

const RankingWidget = () => {
  const [period, setPeriod] = useState<string>("total");
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: [{ [QueryKey.leaderboard]: { period } }],
    });
  };

  return (
    <Card className="h-full">
      <CardContent className="pt-4 h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">랭킹</h2>
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="새로고침"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Tab buttons below title */}
          <div className="flex gap-1 mb-3">
            {periods.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={clsx(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <RankingList period={period} onRefresh={handleRefresh} />
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingWidget;
